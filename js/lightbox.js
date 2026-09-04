/**
 * =========================================================================
 *  IMAGE LIGHTBOX / ZOOM VIEWER (GOOGLE DRIVE STYLE) - HIGH PERFORMANCE
 * =========================================================================
 *  - ระบบ Drag & Pan ไร้รอยต่อแบบ 60-120fps (ปิด transition ชั่วคราวขณะลาก)
 *  - รองรับ Touchscreen บนมือถือเต็มรูปแบบ:
 *    * สัมผัส 1 นิ้ว: ลากเลื่อนดูภาพเมื่อซูม (Pan) หรือปัดซ้าย/ขวาเพื่อเปลี่ยนรูป (Swipe)
 *    * สัมผัส 2 นิ้ว: หนีบ/กางนิ้วเพื่อซูมเข้า-ออก (Pinch to Zoom)
 *    * แตะ 2 ครั้งติดกัน (Double Tap): ซูมขยาย 2x / ดับเบิ้ลคลิกอีกทีเพื่อรีเซ็ต
 *  - ปุ่มซูมเข้า (+), ซูมออก (-), รีเซ็ต (100%) และปุ่มเลื่อนรูป
 *  - รองรับล้อเมาส์ (Scroll Wheel) และคีย์บอร์ด (Esc, ArrowLeft, ArrowRight)
 * =========================================================================
 */

(function () {
    let activeGallery = [];
    let currentIndex = 0;
    let currentZoom = 1;
    let translateX = 0, translateY = 0;

    // Drag / Touch Tracking
    let isDragging = false;
    let isPinching = false;
    let startX = 0, startY = 0;
    let initialPinchDist = 0;
    let initialZoomOnPinch = 1;
    let lastTapTime = 0;
    let rafId = null;

    let lightboxEl, imgEl, captionEl, prevBtn, nextBtn, zoomResetBtn;

    function createLightboxDOM() {
        if (document.getElementById('imageLightbox')) return;

        const html = `
            <div id="imageLightbox" class="image-lightbox" role="dialog" aria-modal="true">
                <div class="lightbox-backdrop"></div>
                <div class="lightbox-header">
                    <span id="lightboxCaption" class="lightbox-title"></span>
                    <div class="lightbox-actions">
                        <button id="lightboxZoomOut" class="lightbox-btn" type="button" title="ซูมออก (-)">−</button>
                        <button id="lightboxZoomReset" class="lightbox-btn" type="button" title="รีเซ็ตขนาด">100%</button>
                        <button id="lightboxZoomIn" class="lightbox-btn" type="button" title="ซูมเข้า (+)">+</button>
                        <button id="lightboxClose" class="lightbox-btn lightbox-close" type="button" title="ปิด (Esc)">✕</button>
                    </div>
                </div>
                <div class="lightbox-body">
                    <button id="lightboxPrev" class="lightbox-nav-btn prev" type="button" title="รูปก่อนหน้า (←)">‹</button>
                    <div class="lightbox-img-wrapper">
                        <img id="lightboxImage" src="" alt="Zoomed view" class="lightbox-img">
                    </div>
                    <button id="lightboxNext" class="lightbox-nav-btn next" type="button" title="รูปถัดไป (→)">›</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        lightboxEl = document.getElementById('imageLightbox');
        imgEl = document.getElementById('lightboxImage');
        captionEl = document.getElementById('lightboxCaption');
        prevBtn = document.getElementById('lightboxPrev');
        nextBtn = document.getElementById('lightboxNext');
        zoomResetBtn = document.getElementById('lightboxZoomReset');

        // Header controls
        document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
        lightboxEl.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);

        document.getElementById('lightboxZoomIn').addEventListener('click', () => adjustZoom(0.3, true));
        document.getElementById('lightboxZoomOut').addEventListener('click', () => adjustZoom(-0.3, true));
        zoomResetBtn.addEventListener('click', () => resetZoom(true));

        prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIndex - 1); });
        nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIndex + 1); });

        // Wheel Zoom
        imgEl.parentElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.25 : -0.25;
            adjustZoom(delta, true);
        }, { passive: false });

        // Double Click (Desktop)
        imgEl.addEventListener('dblclick', (e) => {
            e.preventDefault();
            toggleDoubleTapZoom(e.clientX, e.clientY);
        });

        // ----------------------------------------------------
        // MOUSE DRAG & PAN (DESKTOP)
        // ----------------------------------------------------
        imgEl.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // เฉพาะคลิกซ้าย
            startDrag(e.clientX, e.clientY);
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            moveDrag(e.clientX, e.clientY);
        });

        window.addEventListener('mouseup', endDrag);

        // ----------------------------------------------------
        // TOUCH EVENTS (MOBILE & TABLET)
        // ----------------------------------------------------
        imgEl.addEventListener('touchstart', onTouchStart, { passive: false });
        imgEl.addEventListener('touchmove', onTouchMove, { passive: false });
        imgEl.addEventListener('touchend', onTouchEnd, { passive: false });
        imgEl.addEventListener('touchcancel', onTouchEnd, { passive: false });

        // Keyboard Controls
        window.addEventListener('keydown', (e) => {
            if (!lightboxEl || !lightboxEl.classList.contains('open')) return;

            if (e.key === 'Escape') closeLightbox();
            else if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
            else if (e.key === 'ArrowRight') showImage(currentIndex + 1);
            else if (e.key === '+' || e.key === '=') adjustZoom(0.3, true);
            else if (e.key === '-' || e.key === '_') adjustZoom(-0.3, true);
            else if (e.key === '0') resetZoom(true);
        });
    }

    // ----------------------------------------------------
    // TOUCH HANDLERS (MOBILE)
    // ----------------------------------------------------
    let touchStartX = 0, touchStartY = 0;
    let touchDeltaX = 0, touchDeltaY = 0;

    function onTouchStart(e) {
        if (e.touches.length === 1) {
            // ดับเบิ้ลแทป (Double Tap) ตรวจสอบความถี่การแตะ
            const now = Date.now();
            if (now - lastTapTime < 300) {
                toggleDoubleTapZoom(e.touches[0].clientX, e.touches[0].clientY);
                lastTapTime = 0;
                e.preventDefault();
                return;
            }
            lastTapTime = now;

            // เริ่มการแตะลาก 1 นิ้ว
            isPinching = false;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchDeltaX = 0;
            touchDeltaY = 0;
            startDrag(touchStartX, touchStartY);
        } else if (e.touches.length === 2) {
            // เริ่มต้นการหนีบ/กาง 2 นิ้ว (Pinch to Zoom)
            isPinching = true;
            isDragging = false;
            initialPinchDist = getTouchDistance(e.touches[0], e.touches[1]);
            initialZoomOnPinch = currentZoom;
            imgEl.classList.remove('animating');
            e.preventDefault();
        }
    }

    function onTouchMove(e) {
        if (e.touches.length === 1 && !isPinching) {
            // ลากด้วย 1 นิ้ว
            touchDeltaX = e.touches[0].clientX - touchStartX;
            touchDeltaY = e.touches[0].clientY - touchStartY;

            if (currentZoom > 1) {
                // เลื่อนดูภาพเมื่อซูม
                moveDrag(e.touches[0].clientX, e.touches[0].clientY);
                e.preventDefault();
            } else {
                // ขยับเล็กน้อยเพื่อบอกทิศทาง swipe
                translateX = touchDeltaX * 0.4;
                requestUpdateTransform();
            }
        } else if (e.touches.length === 2) {
            // คำนวณระยะการถ่างนิ้ว (Pinch)
            const newDist = getTouchDistance(e.touches[0], e.touches[1]);
            if (initialPinchDist > 0) {
                const scaleFactor = newDist / initialPinchDist;
                currentZoom = Math.min(Math.max(0.7, initialZoomOnPinch * scaleFactor), 3.5);
                requestUpdateTransform();
            }
            e.preventDefault();
        }
    }

    function onTouchEnd(e) {
        if (isPinching && e.touches.length < 2) {
            isPinching = false;
            if (currentZoom < 1) {
                resetZoom(true);
            } else {
                imgEl.classList.add('animating');
                requestUpdateTransform();
            }
            return;
        }

        if (isDragging) {
            endDrag();

            // ถ้าซูมปกติ (1x) แล้วปัดนิ้ว (Swipe Gesture)
            if (currentZoom === 1) {
                imgEl.classList.add('animating');
                translateX = 0;
                requestUpdateTransform();

                // ปัดซ้าย = รูปถัดไป / ปัดขวา = รูปก่อนหน้า
                if (touchDeltaX < -50 && activeGallery.length > 1) {
                    showImage(currentIndex + 1);
                } else if (touchDeltaX > 50 && activeGallery.length > 1) {
                    showImage(currentIndex - 1);
                } else if (touchDeltaY > 100) {
                    // ปัดลง = ปิด Lightbox
                    closeLightbox();
                }
            }
        }
    }

    function getTouchDistance(t1, t2) {
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        return Math.hypot(dx, dy);
    }

    // ----------------------------------------------------
    // DRAG ENGINE (ลื่นไหล 60-120 FPS ไม่หน่วง)
    // ----------------------------------------------------
    function startDrag(clientX, clientY) {
        isDragging = true;
        startX = clientX - translateX;
        startY = clientY - translateY;

        // ปิด transition ชั่วคราวเพื่อให้การลากติดตามเมาส์/นิ้วแบบ 1:1 ทันที
        imgEl.classList.add('dragging');
        imgEl.classList.remove('animating');
    }

    function moveDrag(clientX, clientY) {
        if (!isDragging) return;

        // คำนวณพิกัดใหม่
        translateX = clientX - startX;
        translateY = clientY - startY;

        // หน่วงขอบเขต (Boundary Clamping) ไม่ให้ภาพหลุดออกนอกจอ
        if (currentZoom > 1) {
            const rect = imgEl.getBoundingClientRect();
            const maxDragX = (rect.width * currentZoom) / 2;
            const maxDragY = (rect.height * currentZoom) / 2;
            translateX = Math.max(-maxDragX, Math.min(maxDragX, translateX));
            translateY = Math.max(-maxDragY, Math.min(maxDragY, translateY));
        }

        requestUpdateTransform();
    }

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        imgEl.classList.remove('dragging');

        // ถ้าซูม 1x ให้เด้งกลับตำแหน่งศูนย์กลาง
        if (currentZoom <= 1) {
            resetZoom(true);
        }
    }

    function requestUpdateTransform() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(applyTransform);
    }

    function applyTransform() {
        if (!imgEl) return;
        imgEl.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${currentZoom})`;
        if (zoomResetBtn) {
            zoomResetBtn.innerText = `${Math.round(currentZoom * 100)}%`;
        }
    }

    // ----------------------------------------------------
    // ZOOM FUNCTIONS
    // ----------------------------------------------------
    function toggleDoubleTapZoom(clientX, clientY) {
        if (currentZoom > 1.2) {
            resetZoom(true);
        } else {
            // ซูมเข้า 2.2x ตรงตำแหน่งที่แตะ
            currentZoom = 2.2;
            const rect = imgEl.getBoundingClientRect();
            translateX = -(clientX - (rect.left + rect.width / 2)) * 0.8;
            translateY = -(clientY - (rect.top + rect.height / 2)) * 0.8;

            imgEl.classList.add('animating');
            requestUpdateTransform();
        }
    }

    function adjustZoom(delta, animated = true) {
        currentZoom = Math.min(Math.max(0.6, currentZoom + delta), 3.5);
        if (currentZoom <= 1) {
            translateX = 0;
            translateY = 0;
        }

        if (animated) {
            imgEl.classList.add('animating');
        } else {
            imgEl.classList.remove('animating');
        }
        requestUpdateTransform();
    }

    function resetZoom(animated = true) {
        currentZoom = 1;
        translateX = 0;
        translateY = 0;

        if (animated) {
            imgEl.classList.add('animating');
        } else {
            imgEl.classList.remove('animating');
        }
        requestUpdateTransform();
    }

    // ----------------------------------------------------
    // OPEN / CLOSE & NAVIGATE
    // ----------------------------------------------------
    function openLightbox(gallery, index) {
        createLightboxDOM();
        activeGallery = gallery;
        currentIndex = index;

        document.body.style.overflow = 'hidden';
        lightboxEl.classList.add('open');

        showImage(currentIndex);
    }

    function closeLightbox() {
        if (!lightboxEl) return;
        lightboxEl.classList.remove('open');
        document.body.style.overflow = '';
        resetZoom(false);
    }

    function showImage(index) {
        if (index < 0 || index >= activeGallery.length) return;

        currentIndex = index;
        resetZoom(false);

        const item = activeGallery[currentIndex];
        imgEl.src = item.src;
        imgEl.alt = item.alt || 'Preview';

        // Title and counter
        let titleText = item.alt || '';
        if (activeGallery.length > 1) {
            titleText += ` (${currentIndex + 1} / ${activeGallery.length})`;
        }
        captionEl.innerText = titleText;

        // Navigation buttons
        if (activeGallery.length <= 1) {
            prevBtn.classList.add('hidden');
            nextBtn.classList.add('hidden');
        } else {
            prevBtn.classList.remove('hidden');
            nextBtn.classList.remove('hidden');
            prevBtn.style.visibility = currentIndex === 0 ? 'hidden' : 'visible';
            nextBtn.style.visibility = currentIndex === activeGallery.length - 1 ? 'hidden' : 'visible';
        }
    }

    // Bind click to all project images
    function bindProjectImages() {
        const projectItems = document.querySelectorAll('.project-item');

        projectItems.forEach(item => {
            const images = item.querySelectorAll('.project-media');
            if (!images.length) return;

            const gallery = Array.from(images).map(img => ({
                src: img.src,
                alt: img.alt || 'Project Image'
            }));

            images.forEach((img, idx) => {
                img.style.cursor = 'zoom-in';
                img.onclick = (e) => {
                    e.stopPropagation();
                    openLightbox(gallery, idx);
                };
            });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(bindProjectImages, 150);
    });

    window.refreshLightboxBindings = bindProjectImages;
})();
