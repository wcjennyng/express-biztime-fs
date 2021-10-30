// npm packages - $npm i supertest
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

//let testCompanies;

beforeEach(async function () {
    await db.query('DELETE FROM invoices')
    await db.query('DELETE FROM companies')
    await db.query("SELECT setval('invoices_id_seq', 1, false)");
    await db.query(`INSERT INTO companies (code, name, description)
                    VALUES ('apple', 'Apple', 'Maker of OSX')`)
    //testCompanies = res.rows[0]

    const inv = await db.query(
        `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
           VALUES ('apple', 100, false, '2018-01-01', null),
                  ('apple', 200, true, '2018-02-01', '2018-02-02')
           RETURNING id`
    )
})

afterAll(async function () {
    await db.end()
})

describe("GET /", function() {
    test('should respond with an array of invoices', async function() {
        const res = await request(app).get('/invoices')
        expect(res.body).toEqual({
            "invoices": [
                {id: 1, comp_code: "apple"},
                {id: 2, comp_code: "apple"}
            ]
        })
    })
})

describe("GET /2", function () {
    test('should return invoice info for invoice 2', async function () {
        const res = await request(app).get('/invoices/2')
        expect(res.body).toEqual({
            "invoice": {
                id: 2, 
                amt: 200,
                add_date: '2018-02-01T05:00:00.000Z',
                paid: true,
                paid_date: '2018-02-02T05:00:00.000Z',
                company: {
                    code: "apple",
                    name: "Apple",
                    description: "Maker of OSX"
                }
            }
        })
    })

    test('should return 404 if invoice not found', async function() {
        const res = await request(app).get('/invoices/100')
        expect(res.status).toEqual(404)
    })
})

describe("POST /", function() {
    test('should add invoice', async function() {
        const res = await request(app).post('/invoices').send({amt: 500, comp_code: 'apple'})
        expect(res.body).toEqual({
            "invoice": {
                id: 3,
                comp_code: "apple",
                amt: 500,
                add_date: expect.any(String),
                paid: false,
                paid_date: null
            }
        })
    })
})

describe("PUT /", function() {
    test('should update an invoice', async function() {
        const res = await request(app).put('/invoices/1').send({amt: 999, paid: true})
        expect(res.body).toEqual({
            "invoice" : {
                id: 1,
                comp_code: 'apple',
                paid: true,
                amt: 999,
                add_date: expect.any(String),
                paid_date: expect.any(String)
            }
        })
    })

    test('should return 500 for missing data', async function() {
        const res = await request(app).put('/invoices/1').send({})
        expect(res.status).toEqual(500)
    })
})

describe("DELETE /", function() {
    test('should delete invoice', async function () {
        const res = await request(app).delete('/invoices/2')
        expect(res.body).toEqual({'status': 'deleted'})
    })
    test('should return 404 for invoice not found', async function() {
        const res = await request(app).delete('/invoices/999')
        expect(res.status).toEqual(404)
    })
})