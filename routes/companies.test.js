
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

describe('GET /', function () {
    test('should respond with an array of companies', async function () {
        const res = await request(app).get('/companies')
        expect(res.body).toEqual({
            "companies": [
                { code: "apple", name: "Apple" }
            ]
        })
    })


})

describe('GET /apple', function () {
    test('should return company info', async function () {
        const res = await request(app).get('/companies/apple')
        expect(res.body).toEqual({
            "company": {
                    code: "apple",
                    name: "Apple",
                    description: "Maker of OSX",
                    invoices: [1, 2]
                }
            })
    })

    test('should return 404 for company not found', async function () {
        const res = await request(app).get('/companies/notfound')
        expect(res.status).toEqual(404)
    })
})

describe('POST /', function () {
    test('should create company', async function () {
        const res = await request(app).post('/companies')
            .send({name: "disney", description: "Walt Disney" })
        expect(res.body).toEqual({
            "company": {
                code: "disney",
                name: "disney",
                description: "Walt Disney"
            }
        })
    })
})

describe('PUT /', function () {
    test('should update company', async function () {
        const res = await request(app).put('/companies/apple')
            .send({ name: "NotApple", description: "Lie" })

        expect(res.body).toEqual({
            "company": {
                code: "apple",
                name: "NotApple",
                description: "Lie"
            }
        })
    })

    test('should return 404 for company not found', async function () {
        const res = await request(app).put('/companies/notfound').send({ name: "notfound" })
        expect(res.status).toEqual(404)
    })
})

describe('DELETE /', function () {
    test('should delete company', async function () {
        const res = await request(app).delete('/companies/apple')
        expect(res.body).toEqual({ "status": "deleted" })
    })
    test('should return 404 for company not found', async function () {
        const res = await request(app).delete('/companies/notfound')
        expect(res.status).toEqual(404)
    })
})