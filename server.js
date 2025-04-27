const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory storage (replace with database in production)
let attendanceRecords = [];

// API endpoint to record attendance
app.post('/api/record', (req, res) => {
    const data = req.body;
    
    // Validate the data
    const requiredFields = [
        "event", "ticket_id", "team_code", 
        "team_name", "participant", "email",
        "mobile", "timestamp", "validation"
    ];
    
    for (const field of requiredFields) {
        if (!(field in data)) {
            return res.status(400).json({ error: `Missing required field: ${field}` });
        }
    }
    
    // Check for duplicate
    const existingRecord = attendanceRecords.find(
        record => record.ticket_id === data.ticket_id
    );
    
    if (existingRecord) {
        return res.status(409).json({ error: "Ticket already scanned" });
    }
    
    // Add to records
    attendanceRecords.push(data);
    
    // Save to CSV file
    saveToCSV();
    
    res.json({ success: true, participant: data.participant });
});

// API endpoint to get all records
app.get('/api/records', (req, res) => {
    res.json(attendanceRecords);
});

// API endpoint to download CSV
app.get('/api/download', (req, res) => {
    if (attendanceRecords.length === 0) {
        return res.status(404).json({ error: "No attendance records available" });
    }
    
    const csvPath = path.join(__dirname, 'attendance.csv');
    res.download(csvPath);
});

function saveToCSV() {
    let csvContent = "Timestamp,Event,Ticket ID,Team Code,Team Name,Participant,Email,Mobile,Validation\n";
    
    attendanceRecords.forEach(record => {
        csvContent += `"${record.timestamp}","${record.event}","${record.ticket_id}",`;
        csvContent += `"${record.team_code}","${record.team_name}","${record.participant}",`;
        csvContent += `"${record.email}","${record.mobile}","${record.validation}"\n`;
    });
    
    fs.writeFileSync('attendance.csv', csvContent);
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});