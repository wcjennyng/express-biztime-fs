const express = require('express')
const slugify = require('slugify')
const router = new express.Router()
const ExpressError = require('../expressError')
const db = require('../db')

// GET /companies
// Returns list of companies, like {companies: [{code, name}, ...]}

router.get('/', async function(req, res, next) {
    try {
        const result = await db.query(`SELECT code, name FROM companies ORDER BY name`)
        return res.json({'companies': result.rows})
    } catch (err) {
        return next(err)
    }
})

// GET /companies/[code]
// Return obj of company: {company: {code, name, description, invoices: [id, ...]}}
// If the company given cannot be found, this should return a 404 status response.

//GET /:code for companies & invoice
// router.get('/:code', async function (req, res, next) {
//     try {
//         let code = req.params.code
//         const result = await db.query(`SELECT code, name, description FROM companies WHERE code = $1`, [code])
//         const iResult = await db.query(`SELECT id FROM invoices WHERE comp_code = $1`, [code])
        
//         if (result.rows.length === 0) {
//             throw new ExpressError(`Company not found: ${code}`, 404) 
//         }

//         const company = result.rows[0]
//         const invoices = iResult.rows

//         company.invoices = invoices.map(inv => inv.id)

//         return res.json({'company': company})
//     } catch (err) {
//         return next(err)
//     }
// })

//GET /:code for companies and industries 
router.get('/:code', async function (req, res, next) {
    try {
        const result = await db.query(`
            SELECT c.code, c.name, c.description FROM companies c 
            LEFT JOIN compindustries ci ON c.code = ci.comp_code
            LEFT JOIN industries i ON ci.ind_code = i.code 
            WHERE c.code = $1`, [req.params.code])
        if (result.rows.length === 0) {
            throw new ExpressError(`Company not found: ${req.params.code}`, 404)
        }

        let { code, name, description } = result.rows[0]
        let industries = result.rows.map(i => i.industry)

        if (industries.result === undefined ) {
            industries = []
        }

        return res.send({ code, name, description, industries }) 
    } catch (e) {
        return next(e)
    }
})


// POST /companies
// Adds a company.
// Needs to be given JSON like: {code, name, description}
// Returns obj of new company: {company: {code, name, description}}

router.post('/', async function(req, res, next) {
    try {
        const { name, description } = req.body 
        const code = slugify(name, {lower:true})
        const result = await db.query(`INSERT INTO companies (code, name, description)
                                        VALUES ($1, $2, $3)
                                        RETURNING code, name, description`, [code, name, description])
        return res.status(201).json({'company': result.rows[0]})
    } catch (err) {
        return next(err)
    }
})

// PUT /companies/[code]
// Edit existing company.
// Should return 404 if company cannot be found.
// Needs to be given JSON like: {name, description}
// Returns update company object: {company: {code, name, description}}

router.put('/:code', async function(req, res, next) {
    try {
        const { name, description } = req.body
        const { code } = req.params
        const result = await db.query(`UPDATE companies SET name=$1, description=$2
                                        WHERE code = $3 RETURNING code, name, description`, 
                                        [name, description, code])
        if (result.rows.length === 0) {
            throw new ExpressError(`Company not found: ${code}`, 404)
        } else {
            return res.json({'company': result.rows[0]})
        }
    } catch (err) {
        return next(err)
    }
})

// DELETE /companies/[code]
// Deletes company.
// Should return 404 if company cannot be found.
// Returns {status: "deleted"}

router.delete('/:code', async function (req, res, next) {
    try {
        const result = await db.query(`DELETE FROM companies WHERE code=$1 
                                    RETURNING code`, [req.params.code])
        if (result.rows.length === 0) {
            throw new ExpressError(`Company not found: ${req.params.code}`, 404)
        } else {
            return res.json({'status': 'deleted'})
        }
    } catch (err) {
        return next(err)
    }
})

module.exports = router
