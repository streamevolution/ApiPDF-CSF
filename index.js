const express = require('express');
const cors = require('cors');
const { PDFDocument } = require('pdf-lib');
const QRCode = require('qrcode');
const fs = require('fs/promises');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/generar-pdf', async (req, res) => {
    try {
        const { nombre, paterno, materno, rfc, curp, fechaNac, correo, estado, municipio, colonia, calle, numExt, cp, al, estatus, inicioOp, regimen } = req.body;

        const templatePdfBytes = await fs.readFile('./plantilla.pdf');
        const pdfDoc = await PDFDocument.load(templatePdfBytes);
        const form = pdfDoc.getForm();

        const setPdfText = (campo, valor) => {
            try { if (valor) form.getTextField(campo).setText(valor); } catch (e) { }
        };

        setPdfText('CampoNombres', nombre);
        setPdfText('CampoPaterno', paterno);
        setPdfText('CampoMaterno', materno);
        setPdfText('CampoRFC', rfc);
        setPdfText('CampoCURP', curp);
        setPdfText('CampoFechaNac', fechaNac);
        setPdfText('CampoCorreo', correo);
        setPdfText('CampoEstado', estado);
        setPdfText('CampoMunicipio', municipio);
        setPdfText('CampoColonia', colonia);
        setPdfText('CampoCalle', calle);
        setPdfText('CampoNumExt', numExt);
        setPdfText('CampoCP', cp);
        setPdfText('CampoAL', al);
        setPdfText('CampoEstatus', estatus);
        setPdfText('CampoInicioOp', inicioOp);
        setPdfText('CampoRegimen', regimen);

        try {
            const qrTexto = "pepe"; 
            const qrImageBuffer = await QRCode.toBuffer(qrTexto, { margin: 0, width: 250 });
            const qrImage = await pdfDoc.embedPng(qrImageBuffer);
            const qrField = form.getTextField('CampoQR');
            const widgets = qrField.acroField.getWidgets();
            const rect = widgets[0].getRectangle();
            const primeraPagina = pdfDoc.getPages()[0];
            primeraPagina.drawImage(qrImage, { x: rect.x, y: rect.y, width: rect.width, height: rect.height });
        } catch (e) {
            console.warn("No se generó QR");
        }

        form.flatten();
        const pdfBytes = await pdfDoc.save();
        const identificador = curp || rfc || Math.floor(Math.random() * 10000);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Ina_${identificador}.pdf"`);
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al generar PDF' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API en puerto ${PORT}`));

