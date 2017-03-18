const express = require('express');
const bodyParser = require('body-parser');
const proxy = require('express-http-proxy');
const latex = require('latex');

const config = {
    latexCommand: 'C:\\texlive\\2016\\bin\\win32\\pdflatex',
    assetsServer: 'http://localhost:9000',
};

const app = express();
const latexBody = bodyParser.text({ type: 'application/x-latex' });

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
            errors: error.message.split('\n'),
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

// Proxy all other requests to webpack-dev-server
app.use('/', proxy(config.assetsServer));

app.listen(3000, () => {
    console.log('LaTeX in the Dark editor is running on http://localhost:3000');
});
