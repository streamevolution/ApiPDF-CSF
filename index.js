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
        // Se agregaron numInt y localidad a la lista
        const { nombre, paterno, materno, rfc, curp, fechaNac, correo, estado, municipio, colonia, tipoVialidad, calle, numExt, numInt, localidad, cp, al, estatus, inicioOp, regimen, qrTexto, fechaEmision, fullName, idcif, ultimoOp } = req.body;

        const templatePdfBytes = await fs.readFile('./plantilla.pdf');
        const pdfDoc = await PDFDocument.load(templatePdfBytes);
        const form = pdfDoc.getForm();

        const setPdfText = (campo, valor) => {
            try { if (valor) form.getTextField(campo).setText(valor); } catch (e) { }
        };

        // --- CAMPOS ---
        setPdfText('CampoNombres', nombre);
        setPdfText('CampoPaterno', paterno);
        setPdfText('CampoMaterno', materno);
        setPdfText('CampoRFC', rfc);
        setPdfText('CampoCURP', curp);
        setPdfText('CampoFechaNac', fechaNac);
        setPdfText('CampoCorreo', correo);
        setPdfText('CampoEstado', estado);
        
        // --- UBICACIÓN ---
        setPdfText('CampoMunicipio', municipio);
        setPdfText('CampoColonia', colonia);
        setPdfText('CampoTipoVialidad', tipoVialidad); 
        setPdfText('CampoCalle', calle);
        setPdfText('CampoNumExt', numExt);
        setPdfText('CampoNumInt', numInt); // NUEVO
        setPdfText('CampoLocalidad', localidad); // NUEVO
        setPdfText('CampoCP', cp);
        
        setPdfText('CampoAL', al);
        setPdfText('CampoEstatus', estatus);
        setPdfText('CampoInicioOp', inicioOp);
        setPdfText('CampoRegimen', regimen);
        setPdfText('CampoFecha', fechaEmision);
        setPdfText('CampoFullName', fullName);
        setPdfText('CampoIDCIF', idcif);
        setPdfText('CampoUltimoOp', ultimoOp);

        try {
            const textoParaQR = qrTexto || "https://www.gob.mx/"; 
            const qrImageBuffer = await QRCode.toBuffer(textoParaQR, { margin: 0, width: 250 });
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
app.listen(PORT, () => console.log(`API de PDFs en puerto ${PORT}`));
