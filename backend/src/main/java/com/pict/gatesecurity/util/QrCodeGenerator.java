package com.pict.gatesecurity.util;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.util.Base64;

@Component
@Slf4j
public class QrCodeGenerator {

    public String generateQrCodeBase64(String content, int width, int height) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, width, height);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            byte[] pngData = outputStream.toByteArray();
            String base64Image = Base64.getEncoder().encodeToString(pngData);
            return "data:image/png;base64," + base64Image;
        } catch (Exception e) {
            log.error("Failed to generate QR code for content: {}", content, e);
            return null;
        }
    }
}
