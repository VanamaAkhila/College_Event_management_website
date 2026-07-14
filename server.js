const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ====== CONNECT DATABASE ======
mongoose.connect("mongodb+srv://vanamaakhila190804_db_user:Akhila19@cluster0.3tgt7k2.mongodb.net/collegeDB")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log("DB Error:", err));

// ====== SCHEMAS ======

const eventSchema = new mongoose.Schema({
  name: String,
  date: String,
  deadline: String,
  branch: String,
  description: String
});

const studentSchema = new mongoose.Schema({
  name: String,
  userId: String,
  password: String,
  branch: String,
  email: String,
  phone: String
});

const registrationSchema = new mongoose.Schema({
  eventId: String,
  eventName: String,
  studentName: String,
  rollNo: String,
  branch: String,
  phone: String,
  email: String
});

const Event = mongoose.model("Event", eventSchema);
const Student = mongoose.model("Student", studentSchema);
const Registration = mongoose.model("Registration", registrationSchema);

// ====== ROUTES ======

// ADD EVENT
app.post("/addEvent", async (req, res) => {
  try {
    const newEvent = new Event(req.body);
    await newEvent.save();
    res.json({ message: "Event Added Successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error saving event" });
  }
});

// GET ALL EVENTS
app.get("/allEvents", async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Error fetching events" });
  }
});

// ACTIVE EVENTS
app.get("/activeEvents", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const events = await Event.find({ deadline: { $gte: today } });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Error fetching active events" });
  }
});

// REGISTER STUDENT
app.post("/registerStudent", async (req, res) => {
  try {
    const { userId } = req.body;
    const existing = await Student.findOne({ userId });

    if (existing) {
      return res.json({ message: "User ID already exists" });
    }

    const newStudent = new Student(req.body);
    await newStudent.save();
    res.json({ message: "Student Registered Successfully" });

  } catch (err) {
    res.status(500).json({ message: "Error saving student" });
  }
});

// STUDENT LOGIN
app.post("/studentLogin", async (req, res) => {
  try {
    const { userId, password } = req.body;
    const student = await Student.findOne({ userId, password });

    if (!student) {
      return res.json({ message: "Invalid Credentials" });
    }

    res.json({ message: "Login Successful", student });

  } catch (err) {
    res.status(500).json({ message: "Login Error" });
  }
});

// REGISTER FOR EVENT
app.post("/registerForEvent", async (req, res) => {
  try {
    const newRegistration = new Registration(req.body);
    await newRegistration.save();
    res.json({ message: "Registered Successfully" });

  } catch (err) {
    res.status(500).json({ message: "Registration Error" });
  }
});

// GET REGISTRATIONS
app.get("/registrations/:eventId", async (req, res) => {
  try {
    const registrations = await Registration.find({
      eventId: req.params.eventId
    });
    res.json(registrations);

  } catch (err) {
    res.status(500).json({ message: "Error fetching registrations" });
  }
});

// ====== OLLAMA DESCRIPTION GENERATION ======

app.post("/generateDescription",async(req,res)=>{
try{

const {
eventName,eventType,organizedBy,startDate,endDate,
venue,chiefGuest,designation,participants,winner,
runner,objective,activities,highlights
}=req.body;

const prompt=`
Write a professional academic event report paragraph of exactly 200 words.

Strict rules:
- One single paragraph
- No headings
- No bullet points
- Do not invent information
- Use only given details

Event Name ${eventName}
Event Type ${eventType}
Organized By ${organizedBy}
Dates ${startDate} to ${endDate}
Venue ${venue}
Chief Guest ${chiefGuest} ${designation}
Participants ${participants}
Winner ${winner}
Runner Up ${runner}
Objective ${objective}
Key Activities ${activities}
Outcome ${highlights}
`;

const response=await axios.post("http://localhost:11434/api/generate",{
model:"phi",
prompt:prompt,
stream:false,
options:{
num_predict:250,
temperature:0.5,
repeat_penalty:1.2
}
});

let description=response.data.response;
description=description.replace(/\n/g," ");
description=description.replace(/\s+/g," ").trim();

res.json({description});

}catch(error){
console.log("Ollama Error:",error.message);
res.status(500).json({message:"Generation Failed"});
}
});



// ====== SERVER START ======

app.listen(5000, () => {
  console.log("Server running on port 5000");
});