/**
 * =========================================================================
 *  PORTFOLIO RENDER SCRIPT
 * =========================================================================
 *  ทำหน้าที่นำข้อมูลจาก data.js มา render ใส่ HTML อัตโนมัติ
 *  พร้อมรองรับ data-original สำหรับลูกเล่น Glitch Effect ของธีม
 * =========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    if (typeof portfolioData === 'undefined') {
        console.error('portfolioData is not loaded. Please make sure js/data.js is imported before render.js.');
        return;
    }

    // 1. กำหนด ID คงที่ให้แต่ละโปรเจกต์ และสุ่มสลับตำแหน่งรูปภาพภายในโปรเจกต์ (ถ้ามีหลายรูป)
    if (Array.isArray(portfolioData.projects)) {
        portfolioData.projects.forEach((proj, idx) => {
            if (!proj.id) {
                proj.id = `project-${idx + 1}`;
            }

            // สุ่มสลับตำแหน่งรูปภาพภายในโปรเจกต์แบบไม่ซ้ำ (Shuffle on Refresh)
            if (portfolioData.randomizeImages !== false) {
                let rawImages = proj.images || proj.image;
                if (Array.isArray(rawImages) && rawImages.length > 1) {
                    shuffleArray(rawImages);
                    if (proj.images) proj.images = rawImages;
                    else proj.image = rawImages;
                }
            }
        });

        // 2. สุ่มลำดับโปรเจกต์แบบไม่ซ้ำ (Fisher-Yates Shuffle) เมื่อตั้งค่า randomizeProjects เป็น true
        if (portfolioData.randomizeProjects !== false) {
            shuffleArray(portfolioData.projects);
        }
    }

    renderProfile(portfolioData.profile);
    renderProjects();
    renderFooter(portfolioData.footer);
});

// ฟังก์ชันสุ่มเรียงลำดับ Array แบบ Fisher-Yates (รับประกันสุ่มครบ ไม่ซ้ำ และกระจายตัวเท่ากัน)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

// Fallback images in case local files are not yet added
const PLACEHOLDER_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Crect width='140' height='140' fill='%23e2e8f0'/%3E%3Ccircle cx='70' cy='52' r='28' fill='%2394a3b8'/%3E%3Cpath d='M28 120 C28 92 48 84 70 84 C92 84 112 92 112 120 Z' fill='%2394a3b8'/%3E%3C/svg%3E";
const PLACEHOLDER_PROJECT = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='720' height='360' viewBox='0 0 720 360'%3E%3Crect width='720' height='360' fill='%23f1f5f9'/%3E%3Crect x='10' y='10' width='700' height='340' fill='none' stroke='%23cbd5e1' stroke-width='2' stroke-dasharray='6,6' rx='8'/%3E%3Ctext x='50%25' y='48%25' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-family='sans-serif' font-size='18' font-weight='600'%3EProject Preview Image%3E%3C/text%3E%3Ctext x='50%25' y='58%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='14'%3EPlace your image in images/projects/ and link it in js/data.js%3C/text%3E%3C/svg%3E";

function renderProfile(profile) {
    if (!profile) return;

    // Name
    const nameEl = document.getElementById('profileName');
    if (nameEl) {
        nameEl.innerText = profile.name;
        nameEl.setAttribute('data-original', profile.name);
        document.title = `Portfolio | ${profile.name}`;
    }

    // Avatar
    const avatarEl = document.getElementById('profileAvatar');
    if (avatarEl) {
        avatarEl.src = profile.avatar;
        avatarEl.alt = profile.name;

        if (profile.avatarSize) {
            avatarEl.style.width = profile.avatarSize;
            avatarEl.style.height = profile.avatarSize;
        }
        if (profile.avatarStyle) {
            avatarEl.setAttribute('style', profile.avatarStyle);
        }

        let triedFormats = [];
        avatarEl.onerror = function() {
            const src = this.src;
            // สลับนามสกุลไฟล์อัตโนมัติกรณีผู้ใช้ใส่รูป .jpg แต่ระบุ .png หรือกลับกัน
            if (src.endsWith('.png') && !triedFormats.includes('jpg')) {
                triedFormats.push('jpg');
                this.src = src.replace(/\.png$/, '.jpg');
            } else if (src.endsWith('.jpg') && !triedFormats.includes('png')) {
                triedFormats.push('png');
                this.src = src.replace(/\.jpg$/, '.png');
            } else if (!triedFormats.includes('jpeg')) {
                triedFormats.push('jpeg');
                this.src = src.replace(/\.(png|jpg)$/, '.jpeg');
            } else {
                this.onerror = null;
                this.src = PLACEHOLDER_AVATAR;
            }
        };
    }

    // Links
    const linksEl = document.getElementById('profileLinks');
    if (linksEl && Array.isArray(profile.links)) {
        linksEl.innerHTML = profile.links.map((link, idx) => {
            const separator = idx < profile.links.length - 1 ? ' | ' : '';
            return `<a href="${link.url}" target="${link.target || '_blank'}">${link.title}</a>${separator}`;
        }).join('');
    }

    // Bio
    const bioEl = document.getElementById('profileBio');
    if (bioEl) {
        bioEl.innerHTML = profile.bio;
        bioEl.setAttribute('data-original', bioEl.innerText);
    }
}

let visibleProjectsCount = 3;

function renderProjects() {
    const listEl = document.getElementById('projectsList');
    if (!listEl || typeof portfolioData === 'undefined' || !Array.isArray(portfolioData.projects)) return;

    const allProjects = portfolioData.projects;
    const totalCount = allProjects.length;
    const batchSize = portfolioData.projectsPerPage || 3;

    // ดึงเฉพาะโปรเจกต์ที่อยู่ในช่วง visible
    const visibleProjects = allProjects.slice(0, visibleProjectsCount);

    listEl.innerHTML = visibleProjects.map((proj, idx) => {
        const projectId = proj.id || `project-${idx + 1}`;
        // Badges HTML (ถ้ามีลิงก์ใช้งานได้ให้เป็น <a> แต่ถ้าเป็น Private/ไม่มี url ให้เป็น <span> ป้ายสถานะที่กดไม่ได้)
        const badgesHtml = (proj.badges || []).map(b => {
            const hasValidUrl = b.url && b.url.trim() !== '' && b.url !== '#' && b.url !== '#projects';
            if (hasValidUrl) {
                const isExternal = b.url.startsWith('http');
                return `<a href="${escapeHtml(b.url)}" target="${isExternal ? '_blank' : '_self'}" ${isExternal ? 'rel="noopener noreferrer"' : ''} title="${escapeHtml(b.label || '')}"><img src="${escapeHtml(b.badgeImg)}" alt="${escapeHtml(b.label || '')}"></a>`;
            } else {
                return `<span class="badge-item badge-static" title="${escapeHtml(b.label || '')}"><img src="${escapeHtml(b.badgeImg)}" alt="${escapeHtml(b.label || '')}"></span>`;
            }
        }).join('');

        // Bullets HTML (ถ้ามีรายการ bullets ใน data.js)
        const bulletsHtml = (Array.isArray(proj.bullets) && proj.bullets.length > 0)
            ? `<ul class="project-bullets">
                ${proj.bullets.map(bullet => `<li data-original="${escapeHtml(stripHtml(bullet))}">${bullet}</li>`).join('')}
               </ul>`
            : '';

        const descHtml = proj.description
            ? `<div class="project-desc" data-original="${escapeHtml(stripHtml(proj.description))}">${proj.description}</div>`
            : '';

        // จัดการรูปภาพ (รองรับทั้ง proj.images หรือ proj.image ไม่ว่าจะเขียนมี s หรือไม่มี s หรือส่งมาเป็น Array/String)
        let rawImages = proj.images || proj.image;
        let imagesList = [];
        if (Array.isArray(rawImages)) {
            imagesList = rawImages.flat();
        } else if (rawImages) {
            imagesList = [rawImages];
        }

        let imagesHtml = '';
        if (imagesList.length === 1) {
            const singleImg = imagesList[0];
            const src = typeof singleImg === 'string' ? singleImg : singleImg.url;
            const alt = (typeof singleImg === 'object' && singleImg.alt) ? singleImg.alt : (proj.imageAlt || proj.title);
            const customImgStyle = proj.imageStyle
                ? `style="${escapeHtml(proj.imageStyle)}"`
                : (proj.imageMaxWidth ? `style="max-width: ${escapeHtml(proj.imageMaxWidth)};"` : '');

            imagesHtml = `<img src="${src}" alt="${escapeHtml(alt)}" class="project-media" ${customImgStyle} onerror="this.onerror=null;this.src='${PLACEHOLDER_PROJECT}'">`;
        } else if (imagesList.length > 1) {
            const galleryCols = proj.galleryColumns || Math.min(imagesList.length, 3);
            const galleryStyle = proj.imageMaxWidth ? `style="max-width: ${escapeHtml(proj.imageMaxWidth)};"` : '';

            imagesHtml = `
                <div class="project-gallery cols-${galleryCols}" ${galleryStyle}>
                    ${imagesList.map((imgItem, idx) => {
                        const src = typeof imgItem === 'string' ? imgItem : imgItem.url;
                        const alt = (typeof imgItem === 'object' && imgItem.alt) ? imgItem.alt : `${proj.title} - Image ${idx + 1}`;
                        const caption = (typeof imgItem === 'object' && imgItem.caption) ? `<span class="gallery-caption">${imgItem.caption}</span>` : '';
                        return `
                            <div class="gallery-item">
                                <img src="${src}" alt="${escapeHtml(alt)}" class="project-media" onerror="this.onerror=null;this.src='${PLACEHOLDER_PROJECT}'">
                                ${caption}
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        return `
            <article class="project-item" id="${projectId}" data-project-title="${escapeHtml(proj.title)}">
                <h3 class="item-title" data-original="${escapeHtml(proj.title)}">${proj.title}</h3>
                <div class="badges">
                    ${badgesHtml}
                </div>
                ${descHtml}
                ${bulletsHtml}
                ${imagesHtml}
            </article>
        `;
    }).join('');

    // ควบคุมการแสดงผลของปุ่ม Load More
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const counterEl = document.getElementById('loadMoreCounter');

    if (loadMoreContainer) {
        if (totalCount > batchSize) {
            loadMoreContainer.style.display = 'block';
            if (visibleProjectsCount < totalCount) {
                if (loadMoreBtn) loadMoreBtn.style.display = 'inline-flex';
                if (counterEl) counterEl.innerText = `(${visibleProjects.length} / ${totalCount})`;
                const oldText = loadMoreContainer.querySelector('.all-loaded-text');
                if (oldText) oldText.remove();
            } else {
                if (loadMoreBtn) loadMoreBtn.style.display = 'none';
                if (!loadMoreContainer.querySelector('.all-loaded-text')) {
                    loadMoreContainer.insertAdjacentHTML('beforeend', '<p class="all-loaded-text">✓ แสดงผลงานทั้งหมดเรียบร้อยแล้ว</p>');
                }
            }
        } else {
            loadMoreContainer.style.display = 'none';
        }
    }

    // ผูก Event Listener ปุ่ม Load More (ผูกเพียงครั้งเดียว)
    if (loadMoreBtn && !loadMoreBtn.dataset.bound) {
        loadMoreBtn.dataset.bound = 'true';
        loadMoreBtn.addEventListener('click', () => {
            visibleProjectsCount += batchSize;
            renderProjects();
            if (typeof window.refreshLightboxBindings === 'function') {
                window.refreshLightboxBindings();
            }
        });
    }
}

// ฟังก์ชันเปิดเผยโปรเจกต์อัตโนมัติ (เช่น เมื่อคลิกจากป๊อปอัป 666 แล้วโปรเจกต์ยังไม่ถูกโหลด)
window.revealProjectById = function(projectId) {
    if (typeof portfolioData === 'undefined' || !Array.isArray(portfolioData.projects)) return;

    const allProjects = portfolioData.projects;
    const targetIdx = allProjects.findIndex((p, idx) => (p.id || `project-${idx + 1}`) === projectId);

    if (targetIdx >= 0 && targetIdx >= visibleProjectsCount) {
        visibleProjectsCount = targetIdx + 1;
        renderProjects();
        if (typeof window.refreshLightboxBindings === 'function') {
            window.refreshLightboxBindings();
        }
    }
};

function renderFooter(footer) {
    const footerEl = document.getElementById('footerText');
    if (footerEl && footer) {
        footerEl.innerText = footer.text;
        footerEl.setAttribute('data-original', footer.text);
    }
}

function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
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
