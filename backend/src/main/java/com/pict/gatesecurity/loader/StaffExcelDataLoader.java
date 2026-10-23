package com.pict.gatesecurity.loader;

import com.pict.gatesecurity.entity.User;
import com.pict.gatesecurity.entity.enums.UserRole;
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
@Order(11)
@RequiredArgsConstructor
@Slf4j
public class StaffExcelDataLoader implements CommandLineRunner {

    private final com.pict.gatesecurity.repository.AuthorizedFacultyRepository authorizedFacultyRepository;

    @Override
    @Transactional
    public void run(String... args) {
        try {
            File excelFile = findExcelFile();
            if (excelFile == null || !excelFile.exists()) {
                log.info("Staff data loader: PICT Staff List file not found, skipping staff seed.");
                return;
            }

            log.info("Staff data loader: Reading staff dataset from {}", excelFile.getAbsolutePath());
            List<StaffRow> staffMembers = parseExcel(excelFile);
            if (staffMembers.isEmpty()) {
                log.warn("Staff data loader: No staff rows found in Excel file.");
                return;
            }

            int addedCount = 0;
            int existingCount = 0;

            for (StaffRow row : staffMembers) {
                if (row.empNo == null || row.empNo.isBlank()) {
                    continue;
                }

                String username = row.empNo.trim();
                String name = (row.fullName != null && !row.fullName.isBlank()) ? row.fullName.trim() : ("Staff " + username);
                String email = username.toLowerCase() + "@pict.edu";
                String staffType = (row.staffType != null && !row.staffType.isBlank()) ? row.staffType.trim() : "Teaching";
                String dept = (row.department != null && !row.department.isBlank()) ? row.department.trim() : "General";

                if (!authorizedFacultyRepository.existsByEmpNo(username)) {
                    com.pict.gatesecurity.entity.AuthorizedFaculty af = com.pict.gatesecurity.entity.AuthorizedFaculty.builder()
                            .empNo(username)
                            .fullName(name)
                            .staffType(staffType)
                            .department(dept)
                            .email(email)
                            .build();
                    authorizedFacultyRepository.save(af);
                    addedCount++;
                } else {
                    existingCount++;
                }
            }

            log.info("Staff data loader finished: {} authorized faculty records newly seeded, {} already existed.",
                    addedCount, existingCount);

        } catch (Exception ex) {
            log.error("Failed to load staff Excel data: {}", ex.getMessage(), ex);
        }
    }

    private File findExcelFile() {
        String[] possiblePaths = {
                "PICT Staff List for Visitors Management Project.xlsx",
                "../PICT Staff List for Visitors Management Project.xlsx",
                "../../PICT Staff List for Visitors Management Project.xlsx",
                "c:/Users/purva/OneDrive/Desktop/CampusAccess-BeforeDeployment/PICT Staff List for Visitors Management Project.xlsx",
                "c:/KshitijKolekar/campusaccesslatest/CampusAccess/PICT Staff List for Visitors Management Project.xlsx"
        };
        for (String p : possiblePaths) {
            File f = new File(p);
            if (f.exists()) return f;
        }
        return null;
    }

    private List<StaffRow> parseExcel(File file) throws Exception {
        List<StaffRow> result = new ArrayList<>();
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

                        // Column A: empno, Column B: staff_type, Column C: full_name, Column D: department
                        String empNo = cellMap.get("A");
                        if (empNo != null && !empNo.isBlank() && !empNo.equalsIgnoreCase("empno")) {
                            StaffRow staff = new StaffRow();
                            staff.empNo = empNo.trim();
                            staff.staffType = cellMap.get("B");
                            staff.fullName = cellMap.get("C");
                            staff.department = cellMap.get("D");
                            result.add(staff);
                        }
                    }
                }
            }
        }
        return result;
    }

    private static class StaffRow {
        String empNo;
        String staffType;
        String fullName;
        String department;
    }
}
