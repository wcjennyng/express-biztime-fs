const express = require('express')
let router = new express.Router()
const ExpressError = require('../expressError')
const db = require('../db')

// GET /invoices
// Return info on invoices: like {invoices: [{id, comp_code}, ...]}

router.get('/', async function (req, res, next) {
    try {
        const result = await db.query(`SELECT id, comp_code FROM invoices ORDER BY id`)
        return res.json({ 'invoices': result.rows })
    } catch (e) {
        return next(e)
    }
})

// GET /invoices/[id]
// Returns obj on given invoice.
// If invoice cannot be found, returns 404.
// Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}

router.get('/:id', async function (req, res, next) {
    try {
        let id = req.params.id

        const result = await db.query(`SELECT i.id, i.comp_code, i.amt, i.paid, i.add_date, i.paid_date, c.name, c.description
                                    FROM invoices i INNER JOIN companies c ON i.comp_code = c.code WHERE id=$1`, [id])

        if (result.rows.length === 0) {
            throw new ExpressError(`Company not found: ${id}`, 404)
        }

        const data = result.rows[0]
        const obj = {
            id: data.id, amt: data.amt, paid: data.paid, add_date: data.add_date, paid_date: data.paid_date,
            company: {
                code: data.comp_code, name: data.name, description: data.description
            }
        }

        return res.json({ 'invoice': obj })

    } catch (e) {
        return next(e)
    }
})

// POST /invoices
// Adds an invoice.
// Needs to be passed in JSON body of: {comp_code, amt}
// Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}

router.post('/', async function (req, res, next) {
    try {
        let { comp_code, amt } = req.body

        const result = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2)
                                        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
                                    [comp_code, amt])
        return res.json({ 'invoice': result.rows[0] })
    } catch (e) {
        return next(e)
    }
})

// PUT /invoices/[id]
// Updates an invoice.
// If invoice cannot be found, returns a 404.
// Needs to be passed in a JSON body of {amt}
// Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}

router.put('/:id', async function (req, res, next) {
    try {
        let { amt, paid } = req.body
        let id = req.params.id
        let paidDate = null

        const currentRes = await db.query(`SELECT paid FROM invoices WHERE id = $1`, [id])

        if (currentRes.rows.length === 0) {
            throw new ExpressError(`Invoice not found: ${id}`, 404)
        }

        const currPaidDate = currentRes.rows[0].paid_date

        if(!currPaidDate && paid) { //paying unpaid invoice: sets paid_date to today
            paidDate = new Date()
        } else if (!paid) { //if unpaid: sets paid_date to null
            paidDate = null 
        } else { //keep current paid_date
            paidDate = currPaidDate
        }

        const result = await db.query(`UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4
                                    RETURNING id, comp_code, amt, paid, add_date, paid_date`,
                                    [amt, paid, paidDate, id])

        
        return res.json({ 'invoice': result.rows[0] })
        
    } catch (e) {
        return next(e)
    }
})

// DELETE /invoices/[id]
// Deletes an invoice.
// If invoice cannot be found, returns a 404.
// Returns: {status: "deleted"}

router.delete('/:id', async function (req, res, next) {
    try {
        let id = req.params.id

        const result = await db.query(`DELETE FROM invoices WHERE id=$1 RETURNING id`, [id])

        if (result.rows.length === 0) {
            throw new ExpressError(`Invoice not found: ${id}`, 404)
        }

        return res.json({'status': 'deleted'})
    } catch (e) {
        return next(e)
    }
})

module.exports = router