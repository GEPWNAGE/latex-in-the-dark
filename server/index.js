require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const proxy = require('express-http-proxy');
const latex = require('./latex');
const path = require('path');

// Config
const {
    PDFLATEX_COMMAND = 'pdflatex',
    BIBTEX_COMMAND = 'bibtex',
    ASSETS_SERVER = 'false',
} = process.env;

const app = express();
const latexBody = bodyParser.text({ type: 'application/x-latex' });
const formBody = bodyParser.urlencoded({ extended: true });

function buildLatex(doc) {
    return latex(doc, {
        passes: [
            [PDFLATEX_COMMAND, "-interaction=nonstopmode"],
            [BIBTEX_COMMAND],
            [PDFLATEX_COMMAND, "-interaction=nonstopmode"],
            [PDFLATEX_COMMAND, "-interaction=nonstopmode"],
        ],
    });
}

app.post('/check-build', latexBody, (req, res) => {
    const doc = req.body;
    const stream = buildLatex(doc);

    stream.on('error', (error) => {
        res.json({
            status: 'error',
            errors: error.message.split('\n'),
        });
    });
    stream.on('end', () => {
        res.json({
            status: 'success',
        });
    });
});

app.post('/build', formBody, (req, res) => {
    const doc = req.param('code');
    const stream = buildLatex(doc);

    res.type('application/pdf');

    stream.on('error', (error) => {
        res.status(500);
        res.end();
    });

    stream.pipe(res);
});

if (ASSETS_SERVER !== 'false') {
    // Proxy all other requests to webpack-dev-server
    app.use('/', proxy(ASSETS_SERVER));
} else {
    app.use('/', express.static(path.resolve(__dirname, '../dist')));
}

app.listen(3000, () => {
    console.log('LaTeX in the Dark editor is running on http://localhost:3000');
});
