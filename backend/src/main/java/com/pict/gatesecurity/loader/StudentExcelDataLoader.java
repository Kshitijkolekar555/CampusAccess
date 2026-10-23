package com.pict.gatesecurity.loader;

import com.pict.gatesecurity.entity.StudentProfile;
import com.pict.gatesecurity.entity.User;
import com.pict.gatesecurity.entity.enums.UserRole;
import com.pict.gatesecurity.repository.StudentProfileRepository;
import com.pict.gatesecurity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.File;
import java.io.InputStream;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

@Component
@Order(10)
@RequiredArgsConstructor
@Slf4j
public class StudentExcelDataLoader implements CommandLineRunner {

    private final com.pict.gatesecurity.repository.AuthorizedStudentRepository authorizedStudentRepository;

    @Override
    @Transactional
    public void run(String... args) {
        try {
            File excelFile = findExcelFile();
            if (excelFile == null || !excelFile.exists()) {
                log.info("Student data loader: TE E&TCE.xlsx not found, skipping student seed.");
                return;
            }

            log.info("Student data loader: Reading student dataset from {}", excelFile.getAbsolutePath());
            List<StudentRow> students = parseExcel(excelFile);
            if (students.isEmpty()) {
                log.warn("Student data loader: No student rows found in Excel file.");
                return;
            }

            int addedCount = 0;
            int existingCount = 0;

            for (StudentRow row : students) {
                if (row.enrollment == null || row.enrollment.isBlank()) {
                    continue;
                }

                String username = row.enrollment.trim().toUpperCase();
                String prn = row.prn != null && !row.prn.isBlank() ? row.prn.trim() : username;
                String rollNo = row.rollNo != null ? row.rollNo.trim() : null;
                String name = row.name != null && !row.name.isBlank() ? row.name.trim() : "Student " + username;
                String email = row.email != null && !row.email.isBlank() ? row.email.trim().toLowerCase() : (username.toLowerCase() + "@pict.edu");
                String phone = row.mobile != null && !row.mobile.isBlank() ? row.mobile.trim() : null;
                String branch = row.branch != null && !row.branch.isBlank() ? row.branch.trim() : "E&TC";
                String division = row.className != null && !row.className.isBlank() ? row.className.trim() : null;

                if (!authorizedStudentRepository.existsByStudentIdIgnoreCase(username)) {
                    com.pict.gatesecurity.entity.AuthorizedStudent as = com.pict.gatesecurity.entity.AuthorizedStudent.builder()
                            .studentId(username)
                            .enrollmentNo(username)
                            .prn(prn)
                            .rollNumber(rollNo)
                            .fullName(name)
                            .department(branch)
                            .academicYear("TE")
                            .className(division)
                            .division(division)
                            .email(email)
                            .mobile(phone)
                            .build();
                    authorizedStudentRepository.save(as);
                    addedCount++;
                } else {
                    existingCount++;
                }
            }

            log.info("Student data loader finished: {} authorized student records newly seeded, {} already existed.",
                    addedCount, existingCount);

        } catch (Exception ex) {
            log.error("Failed to load student Excel data: {}", ex.getMessage(), ex);
        }
    }

    private File findExcelFile() {
        String[] possiblePaths = {
                "TE E&TCE (1).xlsx",
                "../TE E&TCE (1).xlsx",
                "../../TE E&TCE (1).xlsx",
                "c:/Users/purva/OneDrive/Desktop/CampusAccess-BeforeDeployment/TE E&TCE (1).xlsx",
                "c:/KshitijKolekar/campusaccesslatest/CampusAccess/TE E&TCE (1).xlsx",
                "TE E&TCE.xlsx",
                "../TE E&TCE.xlsx",
                "../../TE E&TCE.xlsx",
                "C:/Users/purva/OneDrive/Desktop/CampusAccess-Integration/TE E&TCE.xlsx"
        };
        for (String p : possiblePaths) {
            File f = new File(p);
            if (f.exists()) return f;
        }
        return null;
    }

    private List<StudentRow> parseExcel(File file) throws Exception {
        List<StudentRow> result = new ArrayList<>();
        try (ZipFile zip = new ZipFile(file)) {
            // 1. Shared Strings
            List<String> sharedStrings = new ArrayList<>();
            ZipEntry sstEntry = zip.getEntry("xl/sharedStrings.xml");
            if (sstEntry != null) {
                try (InputStream is = zip.getInputStream(sstEntry)) {
                    DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
                    DocumentBuilder db = dbf.newDocumentBuilder();
                    Document doc = db.parse(is);
                    NodeList siList = doc.getElementsByTagName("si");
                    for (int i = 0; i < siList.getLength(); i++) {
                        Element si = (Element) siList.item(i);
                        NodeList tList = si.getElementsByTagName("t");
                        StringBuilder sb = new StringBuilder();
                        for (int t = 0; t < tList.getLength(); t++) {
                            sb.append(tList.item(t).getTextContent());
                        }
                        sharedStrings.add(sb.toString());
                    }
                }
            }

            // 2. Sheet1
            ZipEntry sheetEntry = zip.getEntry("xl/worksheets/sheet1.xml");
            if (sheetEntry != null) {
                try (InputStream is = zip.getInputStream(sheetEntry)) {
                    DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
                    DocumentBuilder db = dbf.newDocumentBuilder();
                    Document doc = db.parse(is);
                    NodeList rowList = doc.getElementsByTagName("row");

                    for (int i = 1; i < rowList.getLength(); i++) { // Skip header row at index 0
                        Element rowElem = (Element) rowList.item(i);
                        NodeList cList = rowElem.getElementsByTagName("c");
                        Map<String, String> cellMap = new HashMap<>();

                        for (int c = 0; c < cList.getLength(); c++) {
                            Element cElem = (Element) cList.item(c);
                            String cellRef = cElem.getAttribute("r");
                            String colLetter = cellRef.replaceAll("[0-9]", "");
                            String type = cElem.getAttribute("t");

                            NodeList vList = cElem.getElementsByTagName("v");
                            String val = null;
                            if (vList.getLength() > 0) {
                                String raw = vList.item(0).getTextContent();
                                if ("s".equals(type) && !raw.isBlank()) {
                                    int idx = Integer.parseInt(raw);
                                    if (idx >= 0 && idx < sharedStrings.size()) {
                                        val = sharedStrings.get(idx);
                                    }
                                } else {
                                    val = raw;
                                }
                            }
                            cellMap.put(colLetter, val);
                        }

                        // Column mappings from TE E&TCE.xlsx:
                        // A: Enrollment No (e.g. F24ET046)
                        // B: Roll No 2026-27 (e.g. 32103)
                        // C: Class (e.g. TY-V)
                        // D: Name
                        // E: Gender
                        // F: Branch (e.g. E&TC)
                        // H: Mobile No
                        // I: Email ID
                        // J: PRN No
                        String enrollment = cellMap.get("A");
                        if (enrollment != null && !enrollment.isBlank() && !enrollment.equalsIgnoreCase("Enrollment No.")) {
                            StudentRow student = new StudentRow();
                            student.enrollment = enrollment.trim();
                            student.rollNo = cellMap.get("B");
                            student.className = cellMap.get("C");
                            student.name = cellMap.get("D");
                            student.branch = cellMap.get("F");
                            student.mobile = cellMap.get("H");
                            student.email = cellMap.get("I");
                            student.prn = cellMap.get("J");
                            result.add(student);
                        }
                    }
                }
            }
        }
        return result;
    }

    private static class StudentRow {
        String enrollment;
        String rollNo;
        String className;
        String name;
        String branch;
        String mobile;
        String email;
        String prn;
    }
}
