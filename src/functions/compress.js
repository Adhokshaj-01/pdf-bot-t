import fs from 'fs'
import { PDFDocument } from 'pdf-lib'

export async function compress(input_path , out_path){
    const pdfBytes = fs.readFileSync(input_path);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    pdfDoc.setTitle("Compressed PDF");
    pdfDoc.setAuthor("Telegram Bot");

    const compressedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(out_path, compressedPdfBytes);
}