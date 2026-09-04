/**
 * =========================================================================
 *  RETRO 666 FLOATING POPUP WIDGETS & GLITCH EASTER EGG
 *  - Responsive & Draggable
 *  - มีปุ่ม Toggle ON/OFF (ค่าเริ่มต้นคือ OFF ปิดไว้เสมอเมื่อเข้าเว็บ)
 * =========================================================================
 */

let isEasterEggActive = false; // ค่าเริ่มต้น: ปิดไว้เสมอตามที่ผู้ใช้ต้องการ
let currentStep = 1;
let remainingToClose = 1;
let isTransitioning = false;
let spawnTimer = null;
let glitchTimer = null;
let scrambleInterval = null;
const ERROR_DURATION = 10000; // ค้างหน้าจอ Error นาน 10 วินาที

const PASS_RATE = 0.7;

// ฟังก์ชันสุ่มรหัสสี Hex (#000000 - #ffffff)
function getRandomHexColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

// สร้างภาพ SVG สีพื้นแบบสุ่ม
function getRandomColorSvg(color) {
    const hex = color || getRandomHexColor();
    const encodedColor = encodeURIComponent(hex);
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='125'%3E%3Crect width='100%25' height='100%25' fill='${encodedColor}'/%3E%3C/svg%3E`;
}

function escapeHtml(text) {
    return (text || '').replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m];
    });
}

// สุ่มดึงโปรเจกต์และรูปภาพจาก portfolioData.projects
function getRandomProjectItem() {
    if (typeof portfolioData !== 'undefined' && Array.isArray(portfolioData.projects) && portfolioData.projects.length > 0) {
        const items = [];

        portfolioData.projects.forEach((p, pIdx) => {
            const projectId = p.id || `project-${pIdx + 1}`;
            const rawImages = p.images || p.image;
            let imgList = [];
            if (Array.isArray(rawImages)) {
                imgList = rawImages.flat();
            } else if (rawImages) {
                imgList = [rawImages];
            }

            if (imgList.length > 0) {
                imgList.forEach(img => {
                    const src = typeof img === 'string' ? img : img.url;
                    if (src) {
                        items.push({
                            id: projectId,
                            title: p.title || 'Untitled Project',
                            image: src,
                            link: (p.badges && p.badges[0] && p.badges[0].url) ? p.badges[0].url : 'http://portfolio.local/projects'
                        });
                    }
                });
            } else {
                items.push({
                    id: projectId,
                    title: p.title || 'Untitled Project',
                    image: getRandomColorSvg(),
                    link: 'http://portfolio.local/projects'
                });
            }
        });

        if (items.length > 0) {
            return items[Math.floor(Math.random() * items.length)];
        }
    }

    // กรณีไม่มีข้อมูล projects ให้ใช้ค่าเริ่มต้น
    return {
        id: 'projects',
        title: 'System Project Anomaly',
        image: getRandomColorSvg(),
        link: 'http://portfolio.local/projects'
    };
}

// เลื่อนหน้าจอไปยังโปรเจกต์เป้าหมาย พร้อมแอนิเมชันไฮไลท์สี (รองรับ Load More)
function scrollToProject(projectId) {
    let target = document.getElementById(projectId);

    // ถ้าโปรเจกต์เป้าหมายยังไม่แสดงบนหน้าจอ (ซ่อนอยู่ใน Load More) ให้เปิดออกมาก่อน
    if (!target && typeof window.revealProjectById === 'function') {
        window.revealProjectById(projectId);
        target = document.getElementById(projectId);
    }

    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.remove('project-highlight');
        void target.offsetWidth; // Force reflow
        target.classList.add('project-highlight');
        setTimeout(() => {
            target.classList.remove('project-highlight');
        }, 2200);
    }
}
window.scrollToProject = scrollToProject;

// กรณีโหลดไฟล์รูปในเครื่องไม่พบ (404/Error) ให้สลับเป็นสุ่มสีแทนทันที
function handleLiminalImageError(imgEl) {
    imgEl.onerror = null;
    imgEl.src = getRandomColorSvg();
}

let preloadedStep5Bg = null;

// สุ่มภาพพื้นหลังด้วยคำค้นหา (Slop Generator) จาก step5SearchQueries
function getRandomStep5Background() {
    if (typeof portfolioData !== 'undefined' && Array.isArray(portfolioData.step5SearchQueries) && portfolioData.step5SearchQueries.length > 0) {
        const queries = portfolioData.step5SearchQueries;
        const randomQuery = queries[Math.floor(Math.random() * queries.length)];
        const randomSeed = Math.floor(Math.random() * 999999);
        return `https://image.pollinations.ai/prompt/${encodeURIComponent(randomQuery)}?width=1280&height=720&seed=${randomSeed}&nologo=true`;
    }
    // Default fallback prompt
    const defaultQuery = "liminal space uncanny valley weirdcore dark 3d horror";
    const randomSeed = Math.floor(Math.random() * 999999);
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(defaultQuery)}?width=1280&height=720&seed=${randomSeed}&nologo=true`;
}

// สั่งโหลดภาพล่วงหน้าตั้งแต่ Step 4 เพื่อให้แสดงผลได้ทันทีใน Step 5
function preloadStep5Background() {
    const url = getRandomStep5Background();
    const img = new Image();
    img.src = url;
    img.onload = () => { preloadedStep5Bg = url; };
}

function applyStep5Background() {
    const bgUrl = preloadedStep5Bg || getRandomStep5Background();
    preloadedStep5Bg = null;

    // ใส่พื้นหลังสีมืดกลิตช์รอไว้ระหว่างรูปภาพดาวน์โหลด
    document.body.style.backgroundImage = "radial-gradient(circle, #3b0764 0%, #1e1b4b 60%, #050505 100%)";
    document.body.classList.add('step5-active');

    const preloader = new Image();
    preloader.src = bgUrl;
    preloader.onload = function() {
        if (document.body.classList.contains('step5-active')) {
            document.body.style.backgroundImage = `url('${bgUrl}')`;
        }
    };
}

function clearStep5Background() {
    preloadedStep5Bg = null;
    document.body.classList.remove('step5-active');
    document.body.style.backgroundImage = '';
}

const captions = [
    "KEEP SMILING.",
    "THE CORRIDOR EXPANDS.",
    "ALMOST THERE.",
    "CAN YOU HEAR IT?",
    "BUFFER OVERRUN 0x666",
    "DO NOT LOOK BEHIND YOU."
];

const step5Captions = [
    "Y̷O̸U̷ ̷C̴A̷N̸N̸O̸T̷ ̸L̷E̶A̶V̷E̵",
    "0̵x̷6̶6̸6̸_̵F̸A̵T̷A̴L̵_̶E̸R̷R̸O̷R̸",
    "T̴H̶E̶ ̴W̶A̷L̸L̷S̸ ̴A̶R̷E̷ ̷W̶A̷T̴C̷H̷I̸N̵G̷",
    "S̷M̷I̵L̸E̷.̴E̷X̸E̷ ̷I̸S̸ ̷N̸O̷W̸ ̵A̸C̵T̸I̸V̸E̵",
    "F̴I̷N̸A̷L̶ ̷T̵E̴R̷M̸I̸N̵A̸T̷I̸O̵N̷"
];

const corruptedWords = [
    "S̶M̷I̵L̸E̷", "E̶R̸R̸O̷R̸", "6̵6̵6̵", "N̸O̵_E̸X̷I̸T̵",
    "U̵N̵K̸N̵O̸W̵N̴", "V̶O̸I̴D̴", "A̷U̸T̸O̷", "B̴U̸F̶F̸E̷R̷"
];

/**
 * คำนวณพิกัดสุ่มสำหรับหน้าต่างป๊อปอัปให้รองรับทุกขนาดหน้าจอ (Desktop, Tablet, Mobile)
 */
function getRandomCoordsOutsideContainer(idNum) {
    const margin = 12;
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    const widgetWidth = Math.min(250, winW - margin * 2);
    const widgetHeight = 180;

    const maxLeft = Math.max(margin, winW - widgetWidth - margin);
    const maxTop = Math.max(margin, winH - widgetHeight - margin);

    const container = document.getElementById('portfolioContainer');
    const rect = container ? container.getBoundingClientRect() : { left: 0, right: winW, top: 0, bottom: winH };

    const zones = [];

    // พื้นที่ฝั่งซ้ายของ container (ถ้ามีที่ว่างพอ)
    if (rect.left > widgetWidth + margin * 2) {
        zones.push({
            minX: margin,
            maxX: rect.left - widgetWidth - margin,
            minY: margin,
            maxY: maxTop
        });
    }

    // พื้นที่ฝั่งขวาของ container (ถ้ามีที่ว่างพอ)
    if (winW - rect.right > widgetWidth + margin * 2) {
        zones.push({
            minX: rect.right + margin,
            maxX: maxLeft,
            minY: margin,
            maxY: maxTop
        });
    }

    // พื้นที่ด้านบนของ container
    if (rect.top > widgetHeight + margin * 2) {
        zones.push({
            minX: margin,
            maxX: maxLeft,
            minY: margin,
            maxY: rect.top - widgetHeight - margin
        });
    }

    // พื้นที่ด้านล่างของ container
    if (winH - rect.bottom > widgetHeight + margin * 2) {
        zones.push({
            minX: margin,
            maxX: maxLeft,
            minY: rect.bottom + margin,
            maxY: maxTop
        });
    }

    // หากหน้าจอแคบ (Mobile หรือจอเล็ก) กระจายตามมุมต่างๆ ไม่ทับกัน
    if (zones.length === 0) {
        const fallbackSlots = [
            { x: margin, y: margin + 10 },
            { x: maxLeft, y: margin + 10 },
            { x: margin, y: maxTop },
            { x: maxLeft, y: maxTop },
            { x: Math.round((winW - widgetWidth) / 2), y: Math.max(margin, maxTop - 25) }
        ];

        const slot = fallbackSlots[((idNum || 1) - 1) % fallbackSlots.length];
        const jitterX = Math.floor(Math.random() * 16) - 8;
        const jitterY = Math.floor(Math.random() * 16) - 8;

        return {
            top: `${Math.min(maxTop, Math.max(margin, slot.y + jitterY))}px`,
            left: `${Math.min(maxLeft, Math.max(margin, slot.x + jitterX))}px`
        };
    }

    const zone = zones[Math.floor(Math.random() * zones.length)];
    const posX = Math.floor(Math.random() * (zone.maxX - zone.minX + 1)) + zone.minX;
    const posY = Math.floor(Math.random() * (zone.maxY - zone.minY + 1)) + zone.minY;

    return {
        top: `${Math.min(maxTop, Math.max(margin, posY))}px`,
        left: `${Math.min(maxLeft, Math.max(margin, posX))}px`
    };
}

/**
 * คำนวณพิกัด 5 จุดคงที่สำหรับ Step 5
 */
function getStep5FixedCoords(index) {
    const margin = 12;
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    const widgetWidth = Math.min(250, winW - margin * 2);
    const widgetHeight = 180;

    const maxLeft = Math.max(margin, winW - widgetWidth - margin);
    const maxTop = Math.max(margin, winH - widgetHeight - margin);
    const midY = Math.max(margin, Math.min(maxTop, Math.round((winH - widgetHeight) / 2)));
    const midX = Math.max(margin, Math.min(maxLeft, Math.round((winW - widgetWidth) / 2)));

    switch (index) {
        case 1:
            return { top: `${margin}px`, left: `${margin}px` };
        case 2:
            return { top: `${margin}px`, left: `${maxLeft}px` };
        case 3:
            return { top: `${midY}px`, left: `${margin}px` };
        case 4:
            return { top: `${midY}px`, left: `${maxLeft}px` };
        case 5:
        default:
            return { top: `${maxTop}px`, left: `${winW < 600 ? midX : maxLeft}px` };
    }
}

/**
 * ทำให้หน้าต่างสามารถคลิกลากย้ายได้ (Drag & Drop)
 */
function makeDraggable(widget) {
    const titleBar = widget.querySelector('.retro-title-bar');
    if (!titleBar) return;

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    function onStart(e) {
        if (e.target.closest('.retro-close-btn')) return;

        isDragging = true;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        startX = clientX;
        startY = clientY;

        const rect = widget.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        document.querySelectorAll('.retro-widget').forEach(w => w.style.zIndex = 999);
        widget.style.zIndex = 10000;

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }

    function onMove(e) {
        if (!isDragging) return;
        if (e.type === 'touchmove') e.preventDefault();

        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        const deltaX = clientX - startX;
        const deltaY = clientY - startY;

        const margin = 8;
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        const rect = widget.getBoundingClientRect();

        const maxLeft = Math.max(margin, winW - rect.width - margin);
        const maxTop = Math.max(margin, winH - rect.height - margin);

        const newLeft = Math.min(Math.max(margin, initialLeft + deltaX), maxLeft);
        const newTop = Math.min(Math.max(margin, initialTop + deltaY), maxTop);

        widget.style.left = `${newLeft}px`;
        widget.style.top = `${newTop}px`;
    }

    function onEnd() {
        isDragging = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
    }

    titleBar.addEventListener('mousedown', onStart);
    titleBar.addEventListener('touchstart', onStart, { passive: true });
}

function createSingleWidget(idNum) {
    if (!isEasterEggActive) return;

    const widget = document.createElement('div');
    widget.className = 'retro-widget';

    const coords = (currentStep === 5)
        ? getStep5FixedCoords(idNum)
        : getRandomCoordsOutsideContainer(idNum);

    widget.style.top = coords.top;
    widget.style.left = coords.left;

    const projectItem = getRandomProjectItem();
    const randomImg = projectItem.image;
    const projectTitle = projectItem.title;

    if (currentStep === 5) {
        const cap5 = step5Captions[(idNum - 1) % step5Captions.length];
        widget.style.border = '2px solid #ff0000';
        widget.style.boxShadow = '0 0 15px rgba(255, 0, 0, 0.7)';

        widget.innerHTML = `
            <div class="retro-title-bar" style="background: linear-gradient(to right, #450a0a, #991b1b); color: #ffcccc;">
                <span class="retro-title-text" style="cursor: pointer;" onclick="scrollToProject('${escapeHtml(projectItem.id)}')" title="คลิกเพื่อเลื่อนไปยังโปรเจกต์นี้">⚠️ 666_ENTITY - ${escapeHtml(projectTitle)}</span>
                <div class="retro-close-btn" style="background: #7f1d1d; color: #fff; border-color: #ff0000;" onclick="handleWindowClose(this.closest('.retro-widget'))">✕</div>
            </div>
            <div class="retro-nav" style="background: #1a0000; border-color: #ff0000;">
                <input type="text" value="${escapeHtml(projectItem.link)}" style="background: #000; color: #ff3333; border: 1px solid #7f1d1d;" readonly>
            </div>
            <div class="retro-viewport" onclick="scrollToProject('${escapeHtml(projectItem.id)}')" title="คลิกรูปเพื่อเลื่อนไปยังโปรเจกต์นี้" style="background: #110000; cursor: pointer;">
                <img class="retro-img" src="${randomImg}" onerror="handleLiminalImageError(this)" style="filter: contrast(180%) invert(30%) saturate(220%); animation-duration: 0.08s;" alt="${escapeHtml(projectTitle)}">
                <div class="retro-caption" style="background: rgba(120, 0, 0, 0.9); color: #ffffff; font-weight: bold;">${cap5}</div>
            </div>
        `;
    } else {
        const randomCap = captions[Math.floor(Math.random() * captions.length)];
        widget.innerHTML = `
            <div class="retro-title-bar">
                <span class="retro-title-text" style="cursor: pointer;" onclick="scrollToProject('${escapeHtml(projectItem.id)}')" title="คลิกเพื่อเลื่อนไปยังโปรเจกต์นี้">${escapeHtml(projectTitle)}</span>
                <div class="retro-close-btn" onclick="handleWindowClose(this.closest('.retro-widget'))">✕</div>
            </div>
            <div class="retro-nav">
                <input type="text" value="${escapeHtml(projectItem.link)}" readonly>
            </div>
            <div class="retro-viewport" onclick="scrollToProject('${escapeHtml(projectItem.id)}')" title="คลิกรูปเพื่อเลื่อนไปยังโปรเจกต์นี้" style="cursor: pointer;">
                <img class="retro-img" src="${randomImg}" onerror="handleLiminalImageError(this)" alt="${escapeHtml(projectTitle)}">
                <div class="retro-caption">${randomCap}</div>
            </div>
        `;
    }

    makeDraggable(widget);

    const root = document.getElementById('widgetsRoot');
    if (root) root.appendChild(widget);
}

function spawnBatch(count) {
    if (!isEasterEggActive) return;

    const root = document.getElementById('widgetsRoot');
    if (root) root.innerHTML = '';
    remainingToClose = count;

    // เมื่อเข้าสู่ Step 5 เริ่มดาวน์โหลดภาพล่วงหน้าเตรียมไว้ในแคชระหว่างที่ผู้ใช้กำลังปิดหน้าต่าง
    if (count === 4 || count === 5) {
        preloadStep5Background();
    }

    for (let i = 1; i <= count; i++) {
        createSingleWidget(i);
    }
    isTransitioning = false;
}

function handleWindowClose(widgetEl) {
    if (!isEasterEggActive || isTransitioning) return;

    widgetEl.remove();
    remainingToClose--;
    if (remainingToClose === 0) {
        isTransitioning = true;

        if (currentStep === 5) {
            // เมื่อปิดหน้าต่างครบ 5 บานหมด: สลับพื้นหลังเป็นภาพสยองขวัญทันที!
            applyStep5Background();

            // ค้างหน้า Error 10 วินาที เมื่อครบเวลาค่อยรีเซ็ตกลับ Step 1
            triggerContainerGlitch(ERROR_DURATION, () => {
                clearStep5Background();
                resetToStepOneWithCooldown();
            });
            return;
        }

        const isPassed = Math.random() < PASS_RATE;

        if (isPassed) {
            currentStep++;
            const randomStepDelay = Math.floor(Math.random() * 4000) + 3500;

            spawnTimer = setTimeout(() => {
                if (isEasterEggActive) spawnBatch(currentStep);
            }, randomStepDelay);

        } else {
            resetToStepOneWithCooldown();
        }
    }
}

function resetToStepOneWithCooldown() {
    if (!isEasterEggActive) return;

    // เคลียร์พื้นหลัง Step 5 คืนค่าปกติ
    clearStep5Background();

    isTransitioning = true;
    currentStep = 1;
    const root = document.getElementById('widgetsRoot');
    if (root) root.innerHTML = '';

    const cooldownTime = Math.floor(Math.random() * 4000) + 3500;

    spawnTimer = setTimeout(() => {
        if (isEasterEggActive) spawnBatch(1);
    }, cooldownTime);
}

function triggerContainerGlitch(duration = ERROR_DURATION, onComplete) {
    if (!isEasterEggActive) return;

    const container = document.getElementById('portfolioContainer');
    if (!container) return;

    const textNodes = container.querySelectorAll('[data-original]');

    container.classList.add('glitched-red');

    function scramble() {
        textNodes.forEach(node => {
            const originalText = node.getAttribute('data-original');
            let glitched = originalText.split(' ').map(word =>
                Math.random() > 0.4 ? corruptedWords[Math.floor(Math.random() * corruptedWords.length)] : word
            ).join(' ');
            node.innerText = glitched;
        });
    }

    scramble();

    // สุ่มกระตุกสลับคำทุก 1.2 วินาที ตลอดช่วงเวลาที่ค้างหน้า Error (10 วินาที)
    clearInterval(scrambleInterval);
    scrambleInterval = setInterval(() => {
        if (!isEasterEggActive || !container.classList.contains('glitched-red')) {
            clearInterval(scrambleInterval);
            return;
        }
        scramble();
    }, 1200);

    clearTimeout(glitchTimer);
    glitchTimer = setTimeout(() => {
        clearInterval(scrambleInterval);
        container.classList.remove('glitched-red');
        textNodes.forEach(node => {
            node.innerText = node.getAttribute('data-original');
        });

        if (typeof onComplete === 'function') {
            onComplete();
        }
    }, duration);
}

/**
 * ปรับตำแหน่งหน้าต่างที่เปิดอยู่ทั้งหมดเมื่อขนาดหน้าจอเปลี่ยน
 */
function handleWindowResize() {
    const widgets = document.querySelectorAll('.retro-widget');
    if (!widgets.length) return;

    const margin = 10;
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    widgets.forEach((widget) => {
        const rect = widget.getBoundingClientRect();
        const maxLeft = Math.max(margin, winW - rect.width - margin);
        const maxTop = Math.max(margin, winH - rect.height - margin);

        const currentLeft = parseFloat(widget.style.left) || rect.left;
        const currentTop = parseFloat(widget.style.top) || rect.top;

        const clampedLeft = Math.min(Math.max(margin, currentLeft), maxLeft);
        const clampedTop = Math.min(Math.max(margin, currentTop), maxTop);

        widget.style.left = `${clampedLeft}px`;
        widget.style.top = `${clampedTop}px`;
    });
}

/**
 * ระบบควบคุมปุ่มเปิด/ปิด Easter Egg (สำหรับคนสงสัย)
 */
function initEasterEggToggle() {
    const toggleBtn = document.getElementById('retroToggleBtn');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
        if (isEasterEggActive) {
            // สั่งปิดการทำงาน (Turn OFF)
            isEasterEggActive = false;
            clearTimeout(spawnTimer);
            clearTimeout(glitchTimer);
            clearInterval(scrambleInterval);

            // เคลียร์ป๊อปอัปทั้งหมด
            const root = document.getElementById('widgetsRoot');
            if (root) root.innerHTML = '';

            // เคลียร์พื้นหลัง Step 5 (ถ้ามี)
            clearStep5Background();

            // รีเซ็ตการ Glitch (ถ้ามี)
            const container = document.getElementById('portfolioContainer');
            if (container) {
                container.classList.remove('glitched-red');
                const textNodes = container.querySelectorAll('[data-original]');
                textNodes.forEach(node => {
                    node.innerText = node.getAttribute('data-original');
                });
            }

            toggleBtn.classList.remove('active');
            toggleBtn.setAttribute('title', '?');
        } else {
            // สั่งเปิดการทำงาน (Turn ON)
            isEasterEggActive = true;
            currentStep = 1;
            isTransitioning = false;

            toggleBtn.classList.add('active');
            toggleBtn.setAttribute('title', 'Close anomaly');

            // เริ่มเปิดหน้าต่างแรก
            spawnBatch(1);
        }
    });
}

// ตรวจจับเหตุการณ์ Resize หน้าจอ
window.addEventListener('resize', handleWindowResize);

// เริ่มต้นระบบ: ไม่แสดงป๊อปอัปตอนโหลด (ปิดไว้เสมอ) พร้อมเปิดใช้งานปุ่ม Toggle
window.addEventListener('DOMContentLoaded', () => {
    initEasterEggToggle();
});
