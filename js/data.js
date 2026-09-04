/**
 * =========================================================================
 *  PORTFOLIO DATA CONFIGURATION
 * =========================================================================
 *  คุณสามารถแก้ไข เพิ่ม หรือลบข้อมูลส่วนตัวและโปรเจกต์ได้ที่ไฟล์นี้ไฟล์เดียว
 *  โดยไม่ต้องยุ่งกับโค้ด HTML หรือ CSS เลย!
 * 
 *  คำแนะนำในการเปลี่ยนรูป:
 *  1. นำไฟล์รูปของคุณไปวางไว้ในโฟลเดอร์:
 *     - รูปโปรไฟล์: วางไว้ใน images/ เช่น images/profile.png
 *     - รูปผลงานโปรเจกต์: วางไว้ใน images/projects/ เช่น images/projects/my-app.png
 *  2. แก้ไขชื่อไฟล์ที่ตัวแปร avatar หรือ image ด้านล่างให้ตรงกัน
 * =========================================================================
 */

const portfolioData = {
    // --------------------------------------------------
    // ข้อมูลโปรไฟล์ส่วนตัว (Profile Header)
    // --------------------------------------------------
    profile: {
        name: "Natthanan Sutenan",
        avatar: "./images/profile.jpg", // ไฟล์รูปโปรไฟล์ของคุณ (images/profile.jpg)
        avatarSize: "180px", 
        links: [
            {
                title: "Resume",
                url: "pdf/resume.pdf",     // เปลี่ยนลิงก์ไฟล์ Resume ของคุณ (วางไฟล์ใน pdf/resume.pdf)
                target: "_blank"
            },
            {
                title: "LinkedIn",
                url: "https://www.linkedin.com/in/natthanan-sutenan-ba26b242a/", // ใส่ URL LinkedIn ของคุณ
                target: "_blank"
            },
            {
                title: "GitHub",
                url: "https://github.com/natthanansute",    // ใส่ URL GitHub ของคุณ
                target: "_blank"
            }
        ],
        bio: `I'm interested in QA/Test, Automation, Cloud & DevOps, Cybersecurity, and AI/ML.<br>I may not have everything figured out yet, but I'm building my way toward it.<br><b>Email:</b> natthanan.sute@gmail.com`
    },

    // จำนวนโปรเจกต์ที่ต้องการให้แสดงในแต่ละครั้ง (Load More Batch Size)
    projectsPerPage: 3,

    // สุ่มลำดับโปรเจกต์ทุกครั้งที่เปิด/รีเฟรชเว็บ (true = สุ่มสลับผลงานใหม่ๆ ไม่ซ้ำ, false = เรียงตามลำดับเดิม)
    randomizeProjects: true,

    // สุ่มสลับตำแหน่งรูปภาพภายในโปรเจกต์ทุกครั้งที่เปิด/รีเฟรชเว็บ (true = สลับรูปซ้าย-ขวาไปเรื่อยๆ, false = เรียงตามลำดับเดิม)
    randomizeImages: true,

    // --------------------------------------------------
    // รายการผลงานโปรเจกต์ (Projects)
    // อยากเพิ่มโปรเจกต์ใหม่ ให้ Copy ทั้งก้อน { ... } แล้ววางต่อท้ายได้เลย
    // --------------------------------------------------
    projects: [
        {
            title: "Markudhet Software project Management & System Design",
            badges: [
                {
                    label: "Google Sheets",
                    url: "https://docs.google.com/spreadsheets/d/1TA2BCvsT07OPosUnOqsjdX9iY2kUOt_S/edit?usp=sharing&ouid=108248227997456208166&rtpof=true&sd=true",
                    badgeImg: "https://img.shields.io/badge/Google_Sheets-Project_Data-34A853?style=flat&logo=googlesheets&logoColor=white"
                },
                {
                    label: "Figma Prototype",
                    url: "https://www.figma.com/proto/nbFCPlW680pNJd8oofRGqC/Markudhet--Copy-?node-id=0-1&t=EECloplpMuSPcSwR-1",
                    badgeImg: "https://img.shields.io/badge/Figma-Prototype-000000?style=flat&logo=figma&logoColor=white"
                }
            ],
            description: "",
            bullets: [
                "Defined the project initiation, objectives, scope, stakeholders, and requirements.",
                "Developed the Software Development Life Cycle (SDLC) and project planning.",
                "Created UI/UX interface designs and system prototypes using Figma.",
                "Created Test Cases for the Markudhet application to verify expected system behavior."
            ],
            images: [
                "./images/projects/markudhet/Canvas.png",
                "./images/projects/markudhet/Figma.png"
            ],
            imageAlt: "Markudhet Software Design"
        },
        {
            title: "Pico W Web-Based Computer Interaction Automation System",
            badges: [
                {
                    label: "Private Project",
                    url: "#projects",
                    badgeImg: "https://img.shields.io/badge/Status-Private_System-orange?style=flat&labelColor=grey"
                }
            ],
            description: "Headless automation engine designed to humanize and perform automated tasks on daily life.",
            bullets: [
                "Designed and developed a web-based control system using Raspberry Pi Pico W.",
                "Implemented automated mouse and keyboard interaction logic with configurable parameters.",
                "Designed the communication flow between the web interface and the Pico W.",
                "Tested and refined the automation behavior through hands-on experimentation."
            ],
            images: [
                "./images/projects/picow-automation/PicoW.gif",
                "./images/projects/picow-automation/TestPicoW.gif"
            ],
            imageAlt: "Automation Tool"
        
        },
        {
            title: "Web Application Room Reservation System",
            badges: [
                {
                    label: "GitHub",
                    url: "https://github.com/natthanansute/pg4-22-2025",
                    badgeImg: "https://img.shields.io/badge/GitHub-Source_Code-181717?style=flat&logo=github&logoColor=white"
                }
            ],
            description: "A group web application designed to manage university room reservations. The system supports different roles, including Students, Staff, and Lecturers, with features for room availability, booking requests, approval workflows, room management, and booking history.",
            bullets: [
                "Developed a group web application for university room reservations.",
                "Designed system workflows and contributed to application development.",
                "Created and reviewed API Specification checklists to verify requirements and expected system behavior."
            ],
            images: [
                "./images/projects/room-reservation/WebappStd.gif",
                "./images/projects/room-reservation/WebappStaff.gif",
                "./images/projects/room-reservation/MysqlWebApp.png",
                "./images/projects/room-reservation/WebappLec.gif",
                "./images/projects/room-reservation/WebappStd2.gif"
            ],
            imageAlt: "Room Reservation System"
        }
        /*
        // ตัวอย่างการเพิ่มโปรเจกต์ที่ 3 (เอาเครื่องหมายคอมเมนต์ออกแล้วแก้ไขได้เลย):
        ,
        {
            title: "Project Name 3",
            badges: [
                {
                    label: "Demo",
                    url: "https://your-demo-link.com",
                    badgeImg: "https://img.shields.io/badge/Live_Demo-success?style=flat&logo=vercel&labelColor=grey"
                }
            ],
            description: "คำอธิบายโปรเจกต์แบบย่อ ใช้ <b>แท็กตัวหนา</b> ได้",
            image: "./images/projects/your-project.png",
            imageAlt: "Project Name 3"
        }
        */
    ],

    // --------------------------------------------------
    // สุ่มภาพพื้นหลังด้วยคำค้นหา (Slop Image Search / AI Prompts)
    // ระบบจะนำคำค้นหาไปสร้างเป็นลิงก์ดึงภาพสยองขวัญแบบสุ่มสดๆ จากเน็ต (ฟรี ไม่ต้องใช้ API Key)
    // ใช้งานบน GitHub Pages ได้ 100%!
    // --------------------------------------------------
    step5SearchQueries: [
        // 🎭 Uncanny Valley & Toxic Positivity
        "uncanny valley toxic positivity creepy smile vintage 1950s aesthetic horror surreal",
        "distorted mannequins creepy smiling faces eerie retro toxic happiness",

        // 👁️ Dreamcore / Weirdcore
        "dreamcore weirdcore endless nostalgic green hills strange clouds eerie eyes void",
        "weirdcore surreal empty bedroom strange entity nostalgic childhood liminal",

        // 🟡 Liminal Space & The Backrooms
        "the backrooms liminal space endless empty yellow hallway fluorescent light",
        "poolrooms liminal space sterile clean white tiles shallow clear water dreamcore",

        // 🕹️ Low-Poly Retro & PS1 / Vaporwave Horror Myth
        "low poly retro ps1 vaporwave horror silent hill 3d aesthetic dithered graveyard",
        "ps1 graphics retro 90s survival horror foggy cemetery abandoned statue vaporwave"
    ],

    // --------------------------------------------------
    // ข้อความส่วนท้าย (Footer)
    // --------------------------------------------------
    footer: {
        text: "© 2026 Natthanan Sutenan. Built with Clean HTML & CSS & JavaScript.(By Gemini 3.8 Flash)"
    }
};

