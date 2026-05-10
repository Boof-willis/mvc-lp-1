/* ================================================================
   MOUNTAIN VIEW COMMONS / SITE JS
   Shared behaviors: nav scroll, mobile menu, reveals,
   FAQ accordion, gallery filters, lightbox.
   ================================================================ */
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {

        /* ---- Meta Pixel: phone-click event (hardcoded, independent of GTM) ---- */
        document.addEventListener('click', function (e) {
            var a = e.target && e.target.closest && e.target.closest('a[href^="tel:"]');
            if (!a) return;
            if (typeof window.fbq === 'function') {
                window.fbq('track', 'Contact', { content_name: 'Phone Click' });
            }
        }, true);

        /* ---- Reveal on scroll ---- */
        var reveals = document.querySelectorAll('.reveal');
        if (reveals.length && 'IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) {
                        e.target.classList.add('visible');
                        io.unobserve(e.target);
                    }
                });
            }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
            reveals.forEach(function (el) { io.observe(el); });
        } else {
            reveals.forEach(function (el) { el.classList.add('visible'); });
        }

        /* ---- Nav scroll state (solid bg, gold rule on scroll) ---- */
        var navBar = document.querySelector('.nav-bar');
        if (navBar) {
            var navigation = document.querySelector('.navigation');
            var root = document.documentElement;
            var ticking = false;
            var update = function () {
                var isScrolled = window.pageYOffset > 80;
                var scrollMax = document.documentElement.scrollHeight - window.innerHeight;
                var scrollProgress = scrollMax > 0 ? Math.min(window.pageYOffset / scrollMax, 1) : 0;
                navBar.classList.toggle('scrolled', isScrolled);
                if (navigation) navigation.classList.toggle('is-scrolled', isScrolled);
                root.classList.toggle('nav-scrolled', isScrolled);
                root.style.setProperty('--scroll-progress', scrollProgress);
                ticking = false;
            };
            update();
            window.addEventListener('scroll', function () {
                if (!ticking) {
                    requestAnimationFrame(update);
                    ticking = true;
                }
            }, { passive: true });
        }

        /* ---- Mobile menu ---- */
        var toggleBtn = document.querySelector('.nav__toggle');
        var menu = document.querySelector('.mobile-menu');
        var closeBtn = menu ? menu.querySelector('.mobile-menu__close') : null;

        var openMenu = function () {
            if (!menu) return;
            menu.classList.add('open');
            menu.setAttribute('aria-hidden', 'false');
            document.body.classList.add('menu-open');
            if (toggleBtn) {
                toggleBtn.setAttribute('aria-expanded', 'true');
                toggleBtn.setAttribute('aria-label', 'Close menu');
            }
        };
        var closeMenu = function () {
            if (!menu) return;
            menu.classList.remove('open');
            menu.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('menu-open');
            if (toggleBtn) {
                toggleBtn.setAttribute('aria-expanded', 'false');
                toggleBtn.setAttribute('aria-label', 'Open menu');
            }
        };

        if (toggleBtn) {
            toggleBtn.addEventListener('click', function () {
                if (menu && menu.classList.contains('open')) {
                    closeMenu();
                } else {
                    openMenu();
                }
            });
        }
        if (closeBtn) closeBtn.addEventListener('click', closeMenu);
        if (menu) {
            menu.querySelectorAll('a').forEach(function (a) {
                a.addEventListener('click', function () { closeMenu(); });
            });
        }
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeMenu();
        });

        /* ---- FAQ accordion ---- */
        var faqs = document.querySelectorAll('.faq-q');
        faqs.forEach(function (q) {
            q.addEventListener('click', function () {
                var expanded = q.getAttribute('aria-expanded') === 'true';
                var panel = document.getElementById(q.getAttribute('aria-controls'));
                q.setAttribute('aria-expanded', String(!expanded));
                if (panel) {
                    if (!expanded) {
                        panel.style.maxHeight = panel.scrollHeight + 'px';
                    } else {
                        panel.style.maxHeight = '0px';
                    }
                }
            });
        });

        /* ---- Gallery category filter ---- */
        var catBar = document.querySelector('.gallery-cat-bar');
        if (catBar) {
            var cats = catBar.querySelectorAll('.gallery-cat');
            var tiles = document.querySelectorAll('.gallery-tile');
            cats.forEach(function (c) {
                c.addEventListener('click', function () {
                    var target = c.getAttribute('data-cat');
                    cats.forEach(function (other) { other.setAttribute('aria-pressed', other === c ? 'true' : 'false'); });
                    tiles.forEach(function (t) {
                        var match = target === 'all' || t.getAttribute('data-cat') === target;
                        t.style.display = match ? '' : 'none';
                    });
                });
            });
        }

        /* ---- Lightbox ---- */
        var tiles = document.querySelectorAll('.gallery-tile');
        var lightbox = document.querySelector('.lightbox');
        if (tiles.length && lightbox) {
            var lbImg = lightbox.querySelector('.lightbox__img');
            var lbCap = lightbox.querySelector('.lightbox__cap');
            var lbPrev = lightbox.querySelector('.lightbox__nav--prev');
            var lbNext = lightbox.querySelector('.lightbox__nav--next');
            var lbClose = lightbox.querySelector('.lightbox__close');
            var current = 0;
            var visibleTiles = function () {
                return Array.prototype.filter.call(tiles, function (t) {
                    return t.style.display !== 'none';
                });
            };

            var openAt = function (i) {
                var list = visibleTiles();
                if (!list.length) return;
                current = (i + list.length) % list.length;
                var t = list[current];
                var src = t.getAttribute('data-full') || t.querySelector('img').getAttribute('src');
                var cap = t.getAttribute('data-cap') || t.querySelector('img').getAttribute('alt') || '';
                lbImg.setAttribute('src', src);
                lbImg.setAttribute('alt', cap);
                if (lbCap) lbCap.textContent = cap;
                lightbox.classList.add('open');
                lightbox.setAttribute('aria-hidden', 'false');
                document.body.classList.add('menu-open');
            };
            var close = function () {
                lightbox.classList.remove('open');
                lightbox.setAttribute('aria-hidden', 'true');
                document.body.classList.remove('menu-open');
                lbImg.setAttribute('src', '');
            };
            var step = function (dir) {
                openAt(current + dir);
            };

            tiles.forEach(function (t, idx) {
                t.addEventListener('click', function () {
                    var list = visibleTiles();
                    var pos = list.indexOf(t);
                    if (pos >= 0) openAt(pos);
                });
            });
            if (lbPrev) lbPrev.addEventListener('click', function () { step(-1); });
            if (lbNext) lbNext.addEventListener('click', function () { step(1); });
            if (lbClose) lbClose.addEventListener('click', close);
            lightbox.addEventListener('click', function (e) {
                if (e.target === lightbox) close();
            });
            document.addEventListener('keydown', function (e) {
                if (!lightbox.classList.contains('open')) return;
                if (e.key === 'Escape') close();
                if (e.key === 'ArrowLeft') step(-1);
                if (e.key === 'ArrowRight') step(1);
            });
        }

        /* ---- Film / walkthrough video ---- */
        var filmStage = document.getElementById('filmStage');
        var filmVideo = document.getElementById('filmVideo');
        if (filmStage && filmVideo) {
            var startFilm = function () {
                if (filmStage.classList.contains('is-playing')) return;
                filmStage.classList.add('is-playing');
                filmVideo.play().catch(function () {
                    filmStage.classList.remove('is-playing');
                });
            };
            filmStage.addEventListener('click', startFilm);
            filmStage.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    startFilm();
                }
            });
            filmVideo.addEventListener('play', function () {
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({
                    event: 'video_play',
                    video_title: 'MVC Walkthrough',
                    video_provider: 'self-hosted'
                });
            }, { once: true });
            filmVideo.addEventListener('pause', function () {
                if (filmVideo.ended) filmStage.classList.remove('is-playing');
            });
            filmVideo.addEventListener('ended', function () {
                filmStage.classList.remove('is-playing');
                filmVideo.currentTime = 0;
            });
        }

        /* ---- Contact form (LeadConnector webhook, JSON POST) ---- */
        var contactForm = document.getElementById('contact-form');
        if (contactForm) {
            var formStatus = document.getElementById('form-status');
            var submitBtn = contactForm.querySelector('.form__submit');
            var endpoint = contactForm.getAttribute('action');
            var source = contactForm.getAttribute('data-source') || 'Website Form';
            var fallbackPhoneHref = contactForm.getAttribute('data-fallback-phone-href') || '+14352144396';
            var fallbackPhoneDisplay = contactForm.getAttribute('data-fallback-phone-display') || '435.214.4396';
            var defaultHint = formStatus ? formStatus.textContent : '';

            var setStatus = function (msg, tone) {
                if (!formStatus) return;
                formStatus.textContent = msg;
                formStatus.style.color = tone === 'error' ? '#c0392b'
                    : tone === 'success' ? 'var(--gold-deep)'
                    : '';
            };

            // Render the visual confirmation. Used for real submissions AND for
            // honeypot-tripped bot submissions, so the bot believes it succeeded.
            var renderSuccessUI = function () {
                var success = document.createElement('div');
                success.className = 'form__success';
                success.setAttribute('role', 'status');
                success.innerHTML =
                    '<p class="section-block__eyebrow">[ Inquiry Sent ]</p>' +
                    '<h3 class="section-block__title" style="margin-bottom:16px">Thanks — we\u2019ll be in touch.</h3>' +
                    '<p class="section-block__deck" style="margin-bottom:0">' +
                        'Your inquiry just landed with the on-site sales team. They typically respond within an hour during open house hours (Tues\u2013Fri 1\u20135 PM, Sat 11 AM\u20133 PM).<br><br>' +
                        'For an immediate response, call <a href="tel:' + fallbackPhoneHref + '" style="color:var(--gold-deep);border-bottom:1px solid rgba(201,168,76,0.5)">' + fallbackPhoneDisplay + '</a>.' +
                    '</p>';
                contactForm.replaceWith(success);
                success.scrollIntoView({ behavior: 'smooth', block: 'center' });
            };

            // Fire conversion tracking. Only called for verified-human submissions —
            // never for honeypot trips, so bot traffic doesn't inflate Pixel/GTM metrics.
            var fireConversionTracking = function () {
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({
                    event: 'form_submit_success',
                    form_id: contactForm.id || 'contact-form',
                    form_source: source
                });
                if (typeof window.fbq === 'function') {
                    window.fbq('track', 'Lead', {
                        content_name: 'Contact Form',
                        content_category: 'Real Estate'
                    });
                }
            };

            var showSuccess = function () {
                fireConversionTracking();
                renderSuccessUI();
            };

            var validate = function () {
                var required = contactForm.querySelectorAll('[required]');
                for (var i = 0; i < required.length; i++) {
                    var el = required[i];
                    if (!el.value || (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value))) {
                        el.focus();
                        setStatus('Please complete all required fields with a valid email address.', 'error');
                        return false;
                    }
                }
                return true;
            };

            contactForm.addEventListener('submit', function (e) {
                e.preventDefault();

                // Honeypot: hidden field bots will fill but humans never see.
                // Show the success UI so the bot thinks it worked, but skip the
                // webhook POST and skip Pixel/GTM tracking so metrics stay clean.
                var honey = contactForm.querySelector('input[name="_honey"]');
                if (honey && honey.value) {
                    renderSuccessUI();
                    return;
                }

                if (!validate()) return;

                var data = {
                    name: (contactForm.elements['Name'] && contactForm.elements['Name'].value || '').trim(),
                    email: (contactForm.elements['Email'] && contactForm.elements['Email'].value || '').trim(),
                    phone: (contactForm.elements['Phone'] && contactForm.elements['Phone'].value || '').trim(),
                    interest: (contactForm.elements['Interest'] && contactForm.elements['Interest'].value || '').trim(),
                    message: (contactForm.elements['Message'] && contactForm.elements['Message'].value || '').trim(),
                    source: source,
                    page: window.location.href,
                    referrer: document.referrer || '',
                    submittedAt: new Date().toISOString()
                };

                // Pull marketing attribution params (Meta utm_*, fbclid; Google gclid) off the URL
                // so the CRM can map them to contact fields without parsing the page URL string.
                try {
                    var params = new URLSearchParams(window.location.search);
                    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id','fbclid','gclid'].forEach(function (k) {
                        var v = params.get(k);
                        if (v) data[k] = v;
                    });
                } catch (e) { /* older browsers without URLSearchParams — skip */ }

                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Sending\u2026';
                }
                setStatus('Sending your inquiry\u2026');

                var fail = function () {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Schedule My Tour';
                    }
                    setStatus(
                        'Something went wrong sending your inquiry. Please call ' + fallbackPhoneDisplay + ' or email jonathan.crosswhite@vuere.com directly.',
                        'error'
                    );
                };

                if (!window.fetch) {
                    fail();
                    return;
                }

                fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                }).then(function (res) {
                    if (res && res.ok) {
                        showSuccess();
                        return;
                    }
                    return fetch(endpoint, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    }).then(showSuccess).catch(fail);
                }).catch(function () {
                    fetch(endpoint, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    }).then(showSuccess).catch(fail);
                });
            });

            void defaultHint;
        }

        /* ---- Reduced motion ---- */
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('visible'); });
        }

    });
})();
