const express = require('express');
const bodyParser = require('body-parser');
const latex = require('latex');

const config = {
    latexCommand: 'C:\\texlive\\2016\\bin\\win32\\pdflatex',
};

const app = express();
const latexBody = bodyParser.text({ type: 'application/x-latex' });

const testDoc = '\\documentclass{article}\\begin{document}asd\\end{document}';

function buildLatex(doc) {
    return latex(doc, {
        command: config.latexCommand,
    });
}

app.post('/check-build', latexBody, (req, res) => {
    const doc = req.body;
    const stream = buildLatex(doc);

    stream.on('error', (error) => {
        res.json({
            status: 'error',
            error: error.message,
        });
    });
    stream.on('end', () => {
        res.json({
            status: 'success',
        });
    });
});

app.post('/build', latexBody, (req, res) => {
    const doc = req.body;
    const stream = buildLatex(doc);

    res.type('application/pdf');

    stream.on('error', (error) => {
        res.status(500);
        res.end();
    });

    stream.pipe(res);
});

app.listen(3000, () => {
    console.log('LaTeX in the Dark editor is running on http://localhost:3000');
});
