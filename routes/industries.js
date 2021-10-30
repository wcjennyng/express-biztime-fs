const express = require('express')
let router = new express.Router()
const ExpressError = require('../expressError')
const db = require('../db')

//GET / - list of industries

router.get('/', async function (req, res, next) {
    try {
        const result = await db.query(`SELECT i.code as industry_code, i.industry, c.code as company_code FROM industries i 
        LEFT JOIN compindustries ci ON ci.ind_code = i.code
        LEFT JOIN companies c ON c.code = ci.comp_code`)

        console.log(result.rows[0])

        result.rows.forEach((value) => {
            console.log(value.company_code)
            if (value.company_code === null) {
                value.company_code = ''
            }
        })

        return res.json({ 'industries': result.rows })
    } catch (e) {
        return next(e)
    }
})

//GET /:code - displays detail of an industry

router.get('/:code', async (req, res, next) => {
    try {
        let code = req.params.code

        const result = await db.query(`SELECT i.code as industry_code, i.industry, c.code FROM industries i 
        INNER JOIN compindustries ci ON ci.ind_code = i.code
        INNER JOIN companies c ON c.code = ci.comp_code WHERE i.code=$1`, [code])

        if (result.rows.length === 0) {
            throw new ExpressError(`Industry not found: ${code}`)
        }

        console.log(result.rows)
        const { industry_code, industry } = result.rows[0]
        const company_codes = result.rows.map(c => c.code)
        return res.send({ industry_code, industry, company_codes })
    } catch (e) {
        return next(e)
    }

})




//POST / - adds an industry

router.post('/', async function (req, res, next) {
    try {
        let { code, industry } = req.body

        const result = await db.query(
            `INSERT INTO industries (code, industry)
            VALUES ($1, $2)
            RETURNING code, industry`, [code, industry])

        return res.json({ "industry": result.rows[0] })
    } catch (e) {
        return next(e)
    }
})

module.exports = router