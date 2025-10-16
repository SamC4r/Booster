import DashVideo from 'dash-video-element/react';
import 'media-chrome/react';
import 'media-chrome/react/menu';
import { MediaTheme } from 'media-chrome/react/media-theme';
import { MediaLoadingIndicator, MediaPreviewThumbnail } from 'media-chrome/react';
import { THUMBNAIL_FALLBACK } from '../../constants';
import { useState } from 'react';
import { SparklesIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
    src: string | null;
    autoPlay?: boolean
    thumbnailUrl?: string;
    isAI?: boolean;
}

export default function Player({ src, autoPlay, thumbnailUrl, isAI }: Props) {
    const [isHovering, setIsHovering] = useState(false);
    const [showControls, setShowControls] = useState(true);


    const shouldShowBadge = isHovering && showControls;
    return (
        <>
            <template
                id="media-theme-yt"
                dangerouslySetInnerHTML={{
                    __html: `
          <style>
            media-controller {
              font-size: 13px;
              font-family: Roboto, Arial, sans-serif;
              --media-font-family: Roboto, helvetica neue, segoe ui, arial, sans-serif;
              -webkit-font-smoothing: antialiased;
              --media-secondary-color: transparent;
              --media-menu-background: rgba(28, 28, 28, 0.9);
              --media-control-hover-background: var(--media-secondary-color);
              --media-range-track-height: 3px;
              --media-range-thumb-height: 13px;
              --media-range-thumb-width: 13px;
              --media-range-thumb-border-radius: 13px;
              --media-preview-thumbnail-border: 2px solid #fff;
              --media-preview-thumbnail-border-radius: 2px;
              --media-tooltip-display: none;
            }

            /* The biggest size controller is tied to going fullscreen
                instead of a player width */
            media-controller[mediaisfullscreen] {
              font-size: 17px;
              --media-range-thumb-height: 20px;
              --media-range-thumb-width: 20px;
              --media-range-thumb-border-radius: 10px;
              --media-range-track-height: 4px;
            }

            .yt-button {
              position: relative;
              display: inline-block;
              width: 24px;
              padding: 0 2px;
              height: 100%;
              opacity: 0.9;
              transition: opacity 0.1s cubic-bezier(0.4, 0, 1, 1);
              margin-right:10px;
            }
            [breakpointmd] .yt-button {
              width: 24px;
            }
            [mediaisfullscreen] .yt-button {
              width: 30px;
            }

            .yt-button svg {
              height: 100%;
              width: 100%;
              fill: var(--media-primary-color, #fff);
              fill-rule: evenodd;
            }

            .svg-shadow {
              stroke: #000;
              stroke-opacity: 0.15;
              stroke-width: 2px;
              fill: none;
            }
          </style>

          <media-controller
            breakpoints="md:480"
            defaultsubtitles="{{defaultsubtitles}}"
            defaultduration="{{defaultduration}}"
            gesturesdisabled="{{disabled}}"
            hotkeys="{{hotkeys}}"
            nohotkeys="{{nohotkeys}}"
            defaultstreamtype="on-demand"
          >
            <slot name="media" slot="media"></slot>
            <slot name="poster" slot="poster"></slot>
            <slot name="centered-chrome" slot="centered-chrome"></slot>
            <media-error-dialog slot="dialog"></media-error-dialog>

            <!-- Gradient -->
            <style>
              .yt-gradient-bottom {
                padding-top: 37px;
                position: absolute;
                width: 100%;
                height: 170px;
                bottom: 0;
                pointer-events: none;
                background-position: bottom;
                background-repeat: repeat-x;
                background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAACqCAYAAABsziWkAAAAAXNSR0IArs4c6QAAAQVJREFUOE9lyNdHBQAAhfHb3nvvuu2997jNe29TJJEkkkgSSSSJJJJEEkkiifRH5jsP56Xz8PM5gcC/xfDEmjhKxEOCSaREEiSbFEqkQppJpzJMJiWyINvkUCIX8kw+JQqg0BRRxaaEEqVQZsopUQGVpooS1VBjglStqaNEPTSYRko0QbNpoUQrtJl2qsN0UqILuk0PJXqhz/RTYgAGzRA1bEYoMQpjZpwSExAyk5SYgmkzQ82aOUqEIWKilJiHBbNIiSVYhhVYhTVYhw3YhC3Yhh3YhT3YhwM4hCM4hhM4hTM4hwu4hCu4hhu4hTu4hwd4hCd4hhd4hTd4hw/4hC/4hh/4/QM2/id28uIEJAAAAABJRU5ErkJggg==');
              }
            </style>
            <div class="yt-gradient-bottom"></div>

            <!-- Settings Menu -->
            <style>
              media-settings-menu {
                position: absolute;
                right: 12px;
                bottom: 61px;
                z-index: 70;
                will-change: width, height;
                transition: opacity 0.1s cubic-bezier(0, 0, 0.2, 1);
                user-select: none;
                --media-settings-menu-min-width: 220px;
              }
              [mediaisfullscreen] media-settings-menu {
                --media-settings-menu-min-width: 320px;
                right: 24px;
                bottom: 70px;
              }
              media-settings-menu-item {
                height: 40px;
                font-size: 13px;
                font-weight: 500;
                padding-top: 0;
                padding-bottom: 0;
              }

              [mediaisfullscreen] media-settings-menu-item {
                font-size: 20px;
                height: 50px;
              }

              media-settings-menu-item[submenusize='0'] {
                display: none;
              }

              /* Also hide if only 'Auto' is added. */
              .quality-settings[submenusize='1'] {
                display: none;
              }
            </style>
            <media-settings-menu hidden anchor="auto">
              <media-settings-menu-item>
                Playback Speed
                <media-playback-rate-menu slot="submenu" hidden>
                  <div slot="title">Playback Speed</div>
                </media-playback-rate-menu>
              </media-settings-menu-item>
              <media-settings-menu-item class="quality-settings">
                Quality
                <media-rendition-menu slot="submenu" hidden>
                  <div slot="title">Quality</div>
                </media-rendition-menu>
              </media-settings-menu-item>
              <media-settings-menu-item>
                Subtitles/CC
                <media-captions-menu slot="submenu" hidden>
                  <div slot="title">Subtitles/CC</div>
                </media-captions-menu>
              </media-settings-menu-item>
            </media-settings-menu>

            <!-- Time Range / Progress Bar -->
            <style>
              media-time-range {
                position: absolute;
                bottom: 36px;
                width: 100%;
                height: 5px;
                --media-range-track-background: rgba(255, 255, 255, 0.2);
                --media-range-track-pointer-background: rgba(255, 255, 255, 0.5);
                --media-time-range-buffered-color: rgba(255, 255, 255, 0.4);
                --media-range-bar-color: linear-gradient(90deg, #ffb700, #ff6b00);
                --media-range-thumb-border-radius: 13px;
                --media-range-thumb-background: #ff8c00;
                --media-range-thumb-transition: transform 0.1s linear;
                --media-range-thumb-transform: scale(0) translate(0%, 0%);
              }
              media-time-range:hover {
                --media-range-track-height: 5px;
                --media-range-thumb-transform: scale(1) translate(0%, 0%);
              }
              [breakpointmd] media-time-range {
                bottom: 47px;
              }
              [mediaisfullscreen] media-time-range {
                bottom: 52.5px;
                height: 8px;
              }
              [mediaisfullscreen] media-time-range:hover {
                --media-range-track-height: 8px;
              }

              media-preview-thumbnail {
                margin-bottom: 5px;
              }

              media-preview-chapter-display {
                padding-block: 0;
              }

              media-preview-time-display {
                padding-top: 0;
              }
            </style>
            <media-time-range>
              <media-preview-thumbnail slot="preview"></media-preview-thumbnail>
              <media-preview-chapter-display slot="preview"></media-preview-chapter-display>
              <media-preview-time-display slot="preview"></media-preview-time-display>
            </media-time-range>

            <!-- Control Bar -->
            <style>
              media-control-bar {
                position: absolute;
                height: 36px;
                line-height: 36px;
                bottom: 0;
                left: 12px;
                right: 12px;
              }
              [breakpointmd] media-control-bar {
                height: 48px;
                line-height: 48px;
              }
              [mediaisfullscreen] media-control-bar {
                height: 54px;
                line-height: 54px;
              }
            </style>
            <media-control-bar>
              <!-- Play/Pause -->
              <style>
                media-play-button {
                  --media-button-icon-width: 2px;
                  padding: 6px 10px;
                }

                media-play-button #icon-play,
                media-play-button #icon-pause {
                  filter: drop-shadow(0 0 2px #00000080);
                }

                media-play-button :is(#play-p1, #play-p2, #pause-p1, #pause-p2) {
                  transition: clip-path 0.25s ease-in;
                }

                /* Slow down the play icon part hiding slightly
                    to achieve the morphing look a little better */
                media-play-button:not([mediapaused]) #play-p2,
                media-play-button:not([mediapaused]) #play-p2 {
                  transition: clip-path 0.35s ease-in;
                }

                /* Show icon */
                media-play-button :is(#pause-p1, #pause-p2),
                media-play-button[mediapaused] :is(#play-p1, #play-p2) {
                  clip-path: inset(0);
                }

                /* Hide icon wth clip path mask */
                media-play-button #play-p1 {
                  clip-path: inset(0 100% 0 0);
                }
                media-play-button #play-p2 {
                  clip-path: inset(0 20% 0 100%);
                }
                media-play-button[mediapaused] #pause-p1 {
                  clip-path: inset(50% 0 50% 0);
                }
                media-play-button[mediapaused] #pause-p2 {
                  clip-path: inset(50% 0 50% 0);
                }
              </style>
              <media-play-button mediapaused class="yt-button">
                <svg slot="icon" viewBox="0 0 24 24">
                  <g id="icon-play">
                  <g id="play-icon">
                    <path id="play-p1" d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/>
                  </g>
                  <g id="pause-icon">
                    <rect id="pause-p1" x="14" y="3" width="5" height="18" rx="1"/><rect x="5" y="3" width="5" height="18" rx="1"/>
                  </g>
                  </g>
                </svg>
              </media-play-button>

              <!-- Volume/Mute -->
              <style>
                media-mute-button :is(#icon-muted, #icon-volume) {
                  transition: clip-path 0.3s ease-out;
                }
                media-mute-button #icon-muted {
                  clip-path: inset(0 0 100% 0);
                }
                media-mute-button[mediavolumelevel='off'] #icon-muted {
                  clip-path: inset(0);
                }
                media-mute-button #icon-volume {
                  clip-path: inset(0);
                }
                media-mute-button[mediavolumelevel='off'] #icon-volume {
                  clip-path: inset(100% 0 0 0);
                }

                media-mute-button #volume-high,
                media-mute-button[mediavolumelevel='off'] #volume-high {
                  opacity: 1;
                  transition: opacity 0.3s;
                }
                media-mute-button[mediavolumelevel='low'] #volume-high,
                media-mute-button[mediavolumelevel='medium'] #volume-high {
                  opacity: 0.2;
                }

                media-volume-range {
                  height: 36px;
                  --media-range-track-background: rgba(255, 255, 255, 0.2);
                }

                media-mute-button + media-volume-range {
                  width: 0;
                  overflow: hidden;
                  transition: width 0.2s ease-in;
                }

                /* Expand volume control in all relevant states */
                media-mute-button:hover + media-volume-range,
                media-mute-button:focus + media-volume-range,
                media-mute-button:focus-within + media-volume-range,
                media-volume-range:hover,
                media-volume-range:focus,
                media-volume-range:focus-within {
                  width: 70px;
                }
              </style>
              <media-mute-button class="yt-button">
                <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.625" stroke-linecap="round" stroke-linejoin="round">
                  <use class="svg-shadow" xlink:href="#icon-volume"></use>
                  <g id="icon-volume">
                    <path id="speaker" d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/>
                    <path
                      id="volume-low"
                      d="M16 9a5 5 0 0 1 0 6"
                    />

                    <g id="volume-high">
                        <path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>
                    </g>
                  </g>
                  <g id="icon-muted">
                 <path d="M16 9a5 5 0 0 1 .95 2.293"/><path d="M19.364 5.636a9 9 0 0 1 1.889 9.96"/><path d="m2 2 20 20"/><path d="m7 7-.587.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298V11"/><path d="M9.828 4.172A.686.686 0 0 1 11 4.657v.686"/> 
                  </g>
                </svg>
              </media-mute-button>
              <media-volume-range></media-volume-range>

              <!-- Time Display -->
              <style>
                media-time-display {
                  padding-top: 6px;
                  padding-bottom: 6px;
                  margin-left:2px;
                  font-size: 16px;
                }

                [mediaisfullscreen] media-time-display {
                  font-size: 20px;
                }
              </style>
              <media-time-display showduration></media-time-display>

              <!-- Control Spacer -->
              <style>
                .control-spacer {
                  flex-grow: 1;
                }
              </style>
              <span class="control-spacer"></span>

              <!-- Subtitles/CC Button -->
              <style>
                media-captions-button {
                  position: relative;
                }

                /* Disble the captions button when no subtitles are available */
                media-captions-button:not([mediasubtitleslist]) svg {
                  opacity: 0.3;
                }

                media-captions-button[mediasubtitleslist]:after {
                  content: '';
                  display: block;
                  position: absolute;
                  width: 0;
                  height: 3px;
                  border-radius: 3px;
                  background-color: var(--media-accent-color, #f00);
                  bottom: 19%;
                  left: 50%;
                  transition:
                    all 0.1s cubic-bezier(0, 0, 0.2, 1),
                    width 0.1s cubic-bezier(0, 0, 0.2, 1);
                }

                media-captions-button[mediasubtitleslist][aria-checked='true']:after {
                  left: 25%;
                  width: 50%;
                  transition:
                    left 0.25s cubic-bezier(0, 0, 0.2, 1),
                    width 0.25s cubic-bezier(0, 0, 0.2, 1);
                }

                media-captions-button[mediasubtitleslist][aria-checked='true']:after {
                  left: 25%;
                  width: 50%;

                  transition:
                    left 0.25s cubic-bezier(0, 0, 0.2, 1),
                    width 0.25s cubic-bezier(0, 0, 0.2, 1);
                }
              </style>
              <media-captions-button class="yt-button">
                <svg slot="icon" viewBox="0 0 36 36">
                  <use class="svg-shadow" xlink:href="#cc-icon"></use>
                  <path
                    id="cc-icon"
                    d="M9 13.4124C9 12.0801 10.0801 11 11.4124 11H24.5876C25.9199 11 27 12.0801 27 13.4124V22.5876C27 23.9199 25.9199 25 24.5876 25H11.4124C10.0801 25 9 23.9199 9 22.5876V13.4124ZM12 16.1134C12 15.4985 12.4985 15 13.1134 15H15.8866C16.5015 15 17 15.4985 17 16.1134V19.8866C17 20.5015 16.5015 21 15.8866 21H13.1134C12.4985 21 12 20.5015 12 19.8866V16.1134ZM13.5517 16.4545H15.4483V19.5455H13.5517V16.4545ZM17 17H15.4483V19H17V17ZM20.1134 15C19.4985 15 19 15.4985 19 16.1134V19.8866C19 20.5015 19.4985 21 20.1134 21H22.8866C23.5015 21 24 20.5015 24 19.8866V16.1134C24 15.4985 23.5015 15 22.8866 15H20.1134ZM22.4483 16.4545H20.5517V19.5455H22.4483V16.4545ZM22.4483 17H24V19H22.4483V17Z"
                  />
                </svg>
              </media-captions-button>

              <!-- Settings Menu Button -->
              <style>
                media-settings-menu-button svg {
                  transition: transform 0.1s cubic-bezier(0.4, 0, 1, 1);
                  transform: rotateZ(0deg);
                }
                media-settings-menu-button[aria-expanded='true'] svg {
                  transform: rotateZ(30deg);
                }
              </style>
              <media-settings-menu-button class="yt-button">
               <svg slot="icon" id="settings-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings-icon lucide-settings"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="16" cy="16" r="1"/></svg>
              </media-settings-menu-button>

              <!-- PIP/Mini Player Button -->
              <media-pip-button class="yt-button">
                  <svg  slot="icon" id="pip-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-picture-in-picture-icon lucide-picture-in-picture"><path d="M2 10h6V4"/>
                    <path d="m2 4 6 6"/><path d="M21 10V7a2 2 0 0 0-2-2h-7"/>
                    <path d="M3 14v2a2 2 0 0 0 2 2h3"/><rect x="12" y="14" width="10" height="7" rx="1"/>
                  </svg>
              </media-pip-button>

              <!-- Fullscreen Button -->
              <style>
                /* Having trouble getting @property to work in the shadow dom
                   to clean this up. Like https://codepen.io/luwes/pen/oNRyZyx */

                media-fullscreen-button path {
                  translate: 0% 0%;
                }
                media-fullscreen-button:hover path {
                  animation: 0.35s up-left-bounce cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                media-fullscreen-button:hover .urbounce {
                  animation-name: up-right-bounce;
                }
                media-fullscreen-button:hover .dlbounce {
                  animation-name: down-left-bounce;
                }
                media-fullscreen-button:hover .drbounce {
                  animation-name: down-right-bounce;
                }

                @keyframes up-left-bounce {
                  0% {
                    translate: 0 0;
                  }
                  50% {
                    translate: -4% -4%;
                  }
                }
                @keyframes up-right-bounce {
                  0% {
                    translate: 0 0;
                  }
                  50% {
                    translate: 4% -4%;
                  }
                }
                @keyframes down-left-bounce {
                  0% {
                    translate: 0 0;
                  }
                  50% {
                    translate: -4% 4%;
                  }
                }
                @keyframes down-right-bounce {
                  0% {
                    translate: 0 0;
                  }
                  50% {
                    translate: 4% 4%;
                  }
                }
              </style>
              <media-fullscreen-button class="yt-button">
                <svg slot="enter" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-maximize-icon lucide-maximize"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
                <svg slot="exit" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shrink-icon lucide-shrink"><path d="m15 15 6 6m-6-6v4.8m0-4.8h4.8"/><path d="M9 19.8V15m0 0H4.2M9 15l-6 6"/><path d="M15 4.2V9m0 0h4.8M15 9l6-6"/><path d="M9 4.2V9m0 0H4.2M9 9 3 3"/></svg>
              </media-fullscreen-button>
            </media-control-bar>

            <style>
              media-controller[mediacurrenttime^='0'] .desktop-centered-animation svg {
                display: none !important;
                animation-name: none !important;
                opacity: 0 !important;
              }

              @media (width <= 768px) {
                .desktop-centered-animation {
                  display: none;
                }
              }

              .desktop-centered-animation media-play-button {
                width: 48px;
                height: 48px;
                position: relative;
              }

              .desktop-centered-animation media-play-button > svg {
                width: 3rem;
                height: 3rem;
                opacity: 0;
                transform: scale(1);
                pointer-events: none;
                display: none;
                animation: none !important;
              }

              media-controller:not([mediacurrenttime^='0']) .desktop-centered-animation media-play-button > svg[slot='play'],
              media-controller:not([mediacurrenttime^='0']) .desktop-centered-animation media-play-button > svg[slot='pause'] {
                display: block;
                animation: fadeScale 1s ease-out forwards;
              }

              @keyframes fadeScale {
                0% {
                  opacity: 1;
                  transform: scale(1);
                }
                100% {
                  opacity: 0;
                  transform: scale(2);
                }
              }

              .mobile-centered-controls {
                display: flex;
                align-self: stretch;
                align-items: center;
                flex-flow: row nowrap;
                justify-content: center;
                margin: -5% auto 0;
                width: 100%;
                gap: 1rem;
              }

              .mobile-centered-controls [role='button'] {
                --media-icon-color: var(--media-primary-color, #fff);
                background: rgba(0, 0, 0, 0.5);
                --media-button-icon-width: 36px;
                --media-button-icon-height: 36px;
                border-radius: 50%;
                user-select: none;
                aspect-ratio: 1;
              }

              .mobile-centered-controls media-play-button {
                width: 5rem;
              }

              .mobile-centered-controls :is(media-seek-backward-button, media-seek-forward-button) {
                width: 3rem;
                padding: 0.5rem;
              }

              @media (width >= 768px) {
                .mobile-centered-controls {
                  display: none;
                }
              }
            </style>

            <div class="mobile-centered-controls" slot="centered-chrome">
              <media-seek-backward-button></media-seek-backward-button>
              <media-play-button></media-play-button>
              <media-seek-forward-button></media-seek-forward-button>
            </div>

            <div class="desktop-centered-animation" slot="centered-chrome">
           
            </div>
          </media-controller>` }}
            />



            <div className='relative w-full h-full' onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => { setIsHovering(false); setShowControls(true) }}>
                <MediaTheme
                    template="media-theme-yt"
                    className='w-full h-full'
                >


                    <DashVideo
                        slot="media"
                        className='w-full h-full'
                        src={src || ""}
                        playsInline
                        loop
                        crossOrigin="anonymous"
                        autoplay={autoPlay}
                        controls={false}
                    ></DashVideo>

                    <MediaLoadingIndicator noAutohide slot='centered-chrome'></MediaLoadingIndicator>
                    <MediaPreviewThumbnail mediaPreviewImage={thumbnailUrl ?? THUMBNAIL_FALLBACK} slot='slot' />
                </MediaTheme>

                <AnimatePresence>
                    {isAI && shouldShowBadge && (
                        <motion.div
                            className='absolute top-3 right-3 z-50'
                            initial={{ opacity: 0, scale: 0.8, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: -10 }}
                            onClick={() => setShowControls(false)}
                            transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                                duration: 0.3
                            }}
                        >
                            <motion.div
                                className='bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm flex items-center gap-1.5 border border-white border-opacity-20'
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <motion.div
                                    animate={{
                                        rotate: [0, 10, -10, 0],
                                        scale: [1, 1.2, 1]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatType: "reverse"
                                    }}
                                >
                                    <SparklesIcon className='h-3 w-3' />
                                </motion.div>
                                Made with AI
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
