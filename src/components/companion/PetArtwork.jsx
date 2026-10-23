/**
 * Saheli 7.3 — Original Procedural SVG Artwork for All 15 Companions
 *
 * Designed in the warm Saheli design palette:
 * - Rose, Berry, Terracotta, Amber, Emerald, Lilac, River Teal, Earth Brown
 * - Responsive, scalable, accessible SVG vectors with distinctive facial & anatomical traits
 * - Integrated accessory rendering (flower crown, cozy scarf, ribbon bow, star charm, tiny glasses)
 */

export function PetArtwork({
  speciesId = "cat",
  mood = "happy",
  accessory = "none",
  size = 180,
  className = "",
}) {
  // Base coordinate space: 200x200
  const renderSpeciesSvg = () => {
    switch (speciesId) {
      case "cat":
        return (
          <g id="species-cat">
            {/* Ears */}
            <polygon points="50,90 35,40 85,65" fill="#f472b6" />
            <polygon points="52,85 42,48 80,68" fill="#fda4af" />
            <polygon points="150,90 165,40 115,65" fill="#f472b6" />
            <polygon points="148,85 158,48 120,68" fill="#fda4af" />
            {/* Tail */}
            <path d="M150,150 Q185,140 175,100 Q165,95 160,110 Q165,135 140,155 Z" fill="#f472b6" />
            {/* Body */}
            <ellipse cx="100" cy="145" rx="55" ry="45" fill="#f472b6" />
            <ellipse cx="100" cy="150" rx="35" ry="32" fill="#fff1f2" />
            {/* Head */}
            <circle cx="100" cy="95" r="45" fill="#f472b6" />
            {/* Cheeks */}
            <circle cx="75" cy="105" r="7" fill="#f43f5e" opacity="0.3" />
            <circle cx="125" cy="105" r="7" fill="#f43f5e" opacity="0.3" />
            {/* Eyes */}
            {mood === "sleepy" ? (
              <>
                <path
                  d="M78,92 Q85,98 92,92"
                  stroke="#831843"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M108,92 Q115,98 122,92"
                  stroke="#831843"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <ellipse cx="85" cy="90" rx="5" ry="7" fill="#831843" />
                <circle cx="83" cy="88" r="2" fill="#ffffff" />
                <ellipse cx="115" cy="90" rx="5" ry="7" fill="#831843" />
                <circle cx="113" cy="88" r="2" fill="#ffffff" />
              </>
            )}
            {/* Nose & Whiskers */}
            <polygon points="97,99 103,99 100,103" fill="#be185d" />
            <path
              d="M96,104 Q100,107 104,104"
              stroke="#be185d"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <line
              x1="60"
              y1="98"
              x2="40"
              y2="95"
              stroke="#9d174d"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.6"
            />
            <line
              x1="60"
              y1="104"
              x2="42"
              y2="108"
              stroke="#9d174d"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.6"
            />
            <line
              x1="140"
              y1="98"
              x2="160"
              y2="95"
              stroke="#9d174d"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.6"
            />
            <line
              x1="140"
              y1="104"
              x2="158"
              y2="108"
              stroke="#9d174d"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.6"
            />
            {/* Paws */}
            <ellipse cx="75" cy="180" rx="14" ry="10" fill="#fbcfe8" />
            <ellipse cx="125" cy="180" rx="14" ry="10" fill="#fbcfe8" />
          </g>
        );

      case "dog":
        return (
          <g id="species-dog">
            {/* Tail */}
            <path d="M140,150 Q175,130 180,110 Q170,115 155,140 Z" fill="#c2410c" />
            {/* Body */}
            <ellipse cx="100" cy="145" rx="55" ry="45" fill="#fb923c" />
            <ellipse cx="100" cy="150" rx="35" ry="32" fill="#fff7ed" />
            {/* Floppy Ears */}
            <ellipse cx="55" cy="90" rx="14" ry="30" fill="#c2410c" transform="rotate(15 55 90)" />
            <ellipse
              cx="145"
              cy="90"
              rx="14"
              ry="30"
              fill="#c2410c"
              transform="rotate(-15 145 90)"
            />
            {/* Head */}
            <circle cx="100" cy="95" r="45" fill="#fb923c" />
            {/* Muzzle */}
            <ellipse cx="100" cy="108" rx="22" ry="16" fill="#ffedd5" />
            <ellipse cx="100" cy="102" rx="8" ry="6" fill="#7c2d12" />
            <path
              d="M96,110 Q100,114 104,110"
              stroke="#7c2d12"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            {/* Cheeks */}
            <circle cx="70" cy="105" r="7" fill="#ea580c" opacity="0.3" />
            <circle cx="130" cy="105" r="7" fill="#ea580c" opacity="0.3" />
            {/* Eyes */}
            {mood === "sleepy" ? (
              <>
                <path
                  d="M78,88 Q85,94 92,88"
                  stroke="#431407"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M108,88 Q115,94 122,88"
                  stroke="#431407"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <circle cx="85" cy="88" r="6" fill="#431407" />
                <circle cx="83" cy="86" r="2" fill="#ffffff" />
                <circle cx="115" cy="88" r="6" fill="#431407" />
                <circle cx="113" cy="86" r="2" fill="#ffffff" />
              </>
            )}
            {/* Paws */}
            <ellipse cx="75" cy="180" rx="14" ry="10" fill="#ffedd5" />
            <ellipse cx="125" cy="180" rx="14" ry="10" fill="#ffedd5" />
          </g>
        );

      case "rabbit":
        return (
          <g id="species-rabbit">
            {/* Long Upright Ears */}
            <ellipse cx="75" cy="45" rx="12" ry="38" fill="#e879f9" transform="rotate(-6 75 45)" />
            <ellipse cx="75" cy="45" rx="6" ry="30" fill="#fdf4ff" transform="rotate(-6 75 45)" />
            <ellipse cx="125" cy="45" rx="12" ry="38" fill="#e879f9" transform="rotate(6 125 45)" />
            <ellipse cx="125" cy="45" rx="6" ry="30" fill="#fdf4ff" transform="rotate(6 125 45)" />
            {/* Tail */}
            <circle cx="150" cy="155" r="14" fill="#fae8ff" />
            {/* Body */}
            <ellipse cx="100" cy="145" rx="52" ry="42" fill="#e879f9" />
            <ellipse cx="100" cy="150" rx="32" ry="30" fill="#fdf4ff" />
            {/* Head */}
            <circle cx="100" cy="100" r="42" fill="#e879f9" />
            {/* Cheeks */}
            <circle cx="75" cy="110" r="7" fill="#d946ef" opacity="0.3" />
            <circle cx="125" cy="110" r="7" fill="#d946ef" opacity="0.3" />
            {/* Eyes */}
            {mood === "sleepy" ? (
              <>
                <path
                  d="M80,95 Q86,101 92,95"
                  stroke="#701a75"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M108,95 Q114,101 120,95"
                  stroke="#701a75"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <ellipse cx="86" cy="95" rx="5" ry="7" fill="#701a75" />
                <circle cx="84" cy="93" r="2" fill="#ffffff" />
                <ellipse cx="114" cy="95" rx="5" ry="7" fill="#701a75" />
                <circle cx="112" cy="93" r="2" fill="#ffffff" />
              </>
            )}
            {/* Nose & Mouth */}
            <polygon points="97,105 103,105 100,108" fill="#a21caf" />
            <path d="M96,110 Q100,113 104,110" stroke="#a21caf" strokeWidth="1.5" fill="none" />
            {/* Paws */}
            <ellipse cx="75" cy="180" rx="12" ry="9" fill="#fae8ff" />
            <ellipse cx="125" cy="180" rx="12" ry="9" fill="#fae8ff" />
          </g>
        );

      case "fox":
        return (
          <g id="species-fox">
            {/* Big Pointed Ears */}
            <polygon points="45,85 30,30 85,55" fill="#ea580c" />
            <polygon points="47,80 38,40 78,60" fill="#431407" />
            <polygon points="155,85 170,30 115,55" fill="#ea580c" />
            <polygon points="153,80 162,40 122,60" fill="#431407" />
            {/* Bushy Tail with White Tip */}
            <path d="M140,150 Q190,135 185,85 Q165,95 155,130 Z" fill="#ea580c" />
            <path d="M185,85 Q178,100 168,95 Q175,88 185,85 Z" fill="#ffffff" />
            {/* Body */}
            <ellipse cx="100" cy="145" rx="54" ry="44" fill="#f97316" />
            <ellipse cx="100" cy="150" rx="34" ry="30" fill="#fff7ed" />
            {/* Head */}
            <circle cx="100" cy="95" r="44" fill="#f97316" />
            {/* White Face Mask */}
            <path d="M60,100 Q80,125 100,118 Q120,125 140,100 Q100,130 60,100 Z" fill="#ffffff" />
            {/* Nose */}
            <circle cx="100" cy="115" r="5" fill="#1c1917" />
            {/* Eyes */}
            {mood === "sleepy" ? (
              <>
                <path
                  d="M78,92 Q85,98 92,92"
                  stroke="#431407"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M108,92 Q115,98 122,92"
                  stroke="#431407"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <ellipse cx="84" cy="92" rx="5" ry="6" fill="#431407" />
                <circle cx="82" cy="90" r="1.5" fill="#ffffff" />
                <ellipse cx="116" cy="92" rx="5" ry="6" fill="#431407" />
                <circle cx="114" cy="90" r="1.5" fill="#ffffff" />
              </>
            )}
            {/* Paws */}
            <ellipse cx="75" cy="180" rx="13" ry="9" fill="#431407" />
            <ellipse cx="125" cy="180" rx="13" ry="9" fill="#431407" />
          </g>
        );

      case "panda":
        return (
          <g id="species-panda">
            {/* Round Black Ears */}
            <circle cx="58" cy="62" r="18" fill="#1e293b" />
            <circle cx="142" cy="62" r="18" fill="#1e293b" />
            {/* Body */}
            <ellipse cx="100" cy="148" rx="58" ry="46" fill="#1e293b" />
            <ellipse cx="100" cy="154" rx="42" ry="34" fill="#ffffff" />
            {/* Head */}
            <circle cx="100" cy="98" r="46" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
            {/* Black Eye Patches */}
            <ellipse cx="78" cy="94" rx="13" ry="16" fill="#1e293b" transform="rotate(-15 78 94)" />
            <ellipse
              cx="122"
              cy="94"
              rx="13"
              ry="16"
              fill="#1e293b"
              transform="rotate(15 122 94)"
            />
            {/* Eyes */}
            {mood === "sleepy" ? (
              <>
                <path d="M74,94 Q78,98 82,94" stroke="#ffffff" strokeWidth="2" fill="none" />
                <path d="M118,94 Q122,98 126,94" stroke="#ffffff" strokeWidth="2" fill="none" />
              </>
            ) : (
              <>
                <circle cx="78" cy="94" r="4" fill="#ffffff" />
                <circle cx="78" cy="94" r="2" fill="#0f172a" />
                <circle cx="122" cy="94" r="4" fill="#ffffff" />
                <circle cx="122" cy="94" r="2" fill="#0f172a" />
              </>
            )}
            {/* Nose & Mouth */}
            <ellipse cx="100" cy="110" rx="7" ry="5" fill="#1e293b" />
            <path
              d="M96,116 Q100,119 104,116"
              stroke="#1e293b"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            {/* Cheeks */}
            <circle cx="66" cy="110" r="7" fill="#f43f5e" opacity="0.25" />
            <circle cx="134" cy="110" r="7" fill="#f43f5e" opacity="0.25" />
            {/* Paws */}
            <ellipse cx="72" cy="182" rx="15" ry="10" fill="#0f172a" />
            <ellipse cx="128" cy="182" rx="15" ry="10" fill="#0f172a" />
          </g>
        );

      case "bear":
        return (
          <g id="species-bear">
            {/* Round Honey Ears */}
            <circle cx="62" cy="65" r="16" fill="#a16207" />
            <circle cx="62" cy="65" r="9" fill="#ca8a04" />
            <circle cx="138" cy="65" r="16" fill="#a16207" />
            <circle cx="138" cy="65" r="9" fill="#ca8a04" />
            {/* Body */}
            <ellipse cx="100" cy="148" rx="58" ry="46" fill="#a16207" />
            <ellipse cx="100" cy="154" rx="38" ry="34" fill="#fef08a" opacity="0.6" />
            {/* Head */}
            <circle cx="100" cy="98" r="46" fill="#a16207" />
            {/* Muzzle */}
            <ellipse cx="100" cy="112" rx="22" ry="16" fill="#fef08a" opacity="0.8" />
            <ellipse cx="100" cy="106" rx="8" ry="6" fill="#451a03" />
            <path
              d="M96,115 Q100,119 104,115"
              stroke="#451a03"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            {/* Eyes */}
            {mood === "sleepy" ? (
              <>
                <path
                  d="M78,92 Q85,98 92,92"
                  stroke="#451a03"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M108,92 Q115,98 122,92"
                  stroke="#451a03"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <circle cx="84" cy="92" r="5" fill="#451a03" />
                <circle cx="82" cy="90" r="1.5" fill="#ffffff" />
                <circle cx="116" cy="92" r="5" fill="#451a03" />
                <circle cx="114" cy="90" r="1.5" fill="#ffffff" />
              </>
            )}
            {/* Paws */}
            <ellipse cx="72" cy="182" rx="14" ry="10" fill="#713f12" />
            <ellipse cx="128" cy="182" rx="14" ry="10" fill="#713f12" />
          </g>
        );

      case "koala":
        return (
          <g id="species-koala">
            {/* Big Fluffy Ears */}
            <circle cx="50" cy="70" r="24" fill="#94a3b8" />
            <circle cx="50" cy="70" r="15" fill="#e2e8f0" />
            <circle cx="150" cy="70" r="24" fill="#94a3b8" />
            <circle cx="150" cy="70" r="15" fill="#e2e8f0" />
            {/* Body */}
            <ellipse cx="100" cy="148" rx="56" ry="46" fill="#94a3b8" />
            <ellipse cx="100" cy="154" rx="36" ry="34" fill="#f1f5f9" />
            {/* Head */}
            <circle cx="100" cy="98" r="46" fill="#94a3b8" />
            {/* Large Oval Nose */}
            <ellipse cx="100" cy="106" rx="11" ry="16" fill="#334155" />
            {/* Cheeks */}
            <circle cx="68" cy="112" r="7" fill="#f43f5e" opacity="0.25" />
            <circle cx="132" cy="112" r="7" fill="#f43f5e" opacity="0.25" />
            {/* Eyes */}
            {mood === "sleepy" ? (
              <>
                <path
                  d="M78,92 Q84,97 90,92"
                  stroke="#1e293b"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M110,92 Q116,97 122,92"
                  stroke="#1e293b"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <circle cx="82" cy="92" r="5" fill="#1e293b" />
                <circle cx="80" cy="90" r="1.5" fill="#ffffff" />
                <circle cx="118" cy="92" r="5" fill="#1e293b" />
                <circle cx="116" cy="90" r="1.5" fill="#ffffff" />
              </>
            )}
            {/* Paws */}
            <ellipse cx="74" cy="182" rx="14" ry="10" fill="#64748b" />
            <ellipse cx="126" cy="182" rx="14" ry="10" fill="#64748b" />
          </g>
        );

      case "hamster":
        return (
          <g id="species-hamster">
            {/* Tiny Round Ears */}
            <circle cx="65" cy="72" r="13" fill="#f59e0b" />
            <circle cx="65" cy="72" r="7" fill="#fed7aa" />
            <circle cx="135" cy="72" r="13" fill="#f59e0b" />
            <circle cx="135" cy="72" r="7" fill="#fed7aa" />
            {/* Body */}
            <ellipse cx="100" cy="146" rx="55" ry="46" fill="#f59e0b" />
            <ellipse cx="100" cy="150" rx="35" ry="34" fill="#fffbeb" />
            {/* Head with Chubby Cheeks */}
            <circle cx="100" cy="102" r="42" fill="#f59e0b" />
            <circle cx="70" cy="116" r="16" fill="#fed7aa" />
            <circle cx="130" cy="116" r="16" fill="#fed7aa" />
            {/* Blush */}
            <circle cx="68" cy="116" r="7" fill="#f43f5e" opacity="0.3" />
            <circle cx="132" cy="116" r="7" fill="#f43f5e" opacity="0.3" />
            {/* Nose & Mouth */}
            <polygon points="98,106 102,106 100,109" fill="#b45309" />
            <path
              d="M97,112 Q100,115 103,112"
              stroke="#b45309"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Eyes */}
            {mood === "sleepy" ? (
              <>
                <path
                  d="M80,96 Q85,101 90,96"
                  stroke="#78350f"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M110,96 Q115,101 120,96"
                  stroke="#78350f"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <circle cx="85" cy="96" r="5" fill="#78350f" />
                <circle cx="83" cy="94" r="1.5" fill="#ffffff" />
                <circle cx="115" cy="96" r="5" fill="#78350f" />
                <circle cx="113" cy="94" r="1.5" fill="#ffffff" />
              </>
            )}
            {/* Little Hands Clasping */}
            <ellipse cx="94" cy="144" rx="6" ry="5" fill="#fed7aa" />
            <ellipse cx="106" cy="144" rx="6" ry="5" fill="#fed7aa" />
            {/* Paws */}
            <ellipse cx="76" cy="180" rx="11" ry="8" fill="#fed7aa" />
            <ellipse cx="124" cy="180" rx="11" ry="8" fill="#fed7aa" />
          </g>
        );

      case "hedgehog":
        return (
          <g id="species-hedgehog">
            {/* Spiky Quill Shell on Back */}
            <path
              d="M40,110 Q35,60 80,45 Q120,40 160,65 Q175,95 165,145 Q150,175 100,175 Q55,175 40,110 Z"
              fill="#78716c"
            />
            {/* Decorative gentle quills */}
            <polygon points="50,65 58,45 66,65" fill="#57534e" />
            <polygon points="75,50 85,30 95,50" fill="#57534e" />
            <polygon points="105,48 118,28 128,50" fill="#57534e" />
            <polygon points="135,58 150,40 155,65" fill="#57534e" />
            <polygon points="152,85 172,75 165,98" fill="#57534e" />
            <polygon points="155,115 174,115 162,130" fill="#57534e" />
            {/* Soft Belly & Face */}
            <ellipse cx="95" cy="120" rx="46" ry="42" fill="#e7e5e4" />
            {/* Cute Pointed Snout */}
            <path d="M70,120 Q60,118 50,122 Q60,128 72,128 Z" fill="#d6d3d1" />
            <circle cx="50" cy="122" r="4" fill="#292524" />
            {/* Cheeks */}
            <circle cx="75" cy="122" r="6" fill="#f43f5e" opacity="0.3" />
            {/* Eyes */}
            {mood === "sleepy" ? (
              <path
                d="M78,110 Q83,115 88,110"
                stroke="#292524"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
            ) : (
              <>
                <circle cx="82" cy="110" r="4.5" fill="#292524" />
                <circle cx="80" cy="108" r="1.5" fill="#ffffff" />
              </>
            )}
            {/* Soft Ear */}
            <ellipse cx="108" cy="102" rx="7" ry="10" fill="#d6d3d1" />
            {/* Little Feet */}
            <ellipse cx="80" cy="162" rx="10" ry="7" fill="#d6d3d1" />
            <ellipse cx="120" cy="162" rx="10" ry="7" fill="#d6d3d1" />
          </g>
        );

      case "penguin":
        return (
          <g id="species-penguin">
            {/* Blue-Black Body */}
            <ellipse cx="100" cy="130" rx="55" ry="58" fill="#0284c7" />
            {/* Flippers */}
            <ellipse
              cx="45"
              cy="130"
              rx="10"
              ry="28"
              fill="#0369a1"
              transform="rotate(18 45 130)"
            />
            <ellipse
              cx="155"
              cy="130"
              rx="10"
              ry="28"
              fill="#0369a1"
              transform="rotate(-18 155 130)"
            />
            {/* White Belly */}
            <ellipse cx="100" cy="138" rx="36" ry="42" fill="#ffffff" />
            {/* Head Cap */}
            <circle cx="100" cy="85" r="40" fill="#0284c7" />
            <ellipse cx="100" cy="94" rx="30" ry="26" fill="#ffffff" />
            {/* Cheeks */}
            <circle cx="76" cy="102" r="6" fill="#f43f5e" opacity="0.3" />
            <circle cx="124" cy="102" r="6" fill="#f43f5e" opacity="0.3" />
            {/* Eyes */}
            {mood === "sleepy" ? (
              <>
                <path
                  d="M80,88 Q86,94 92,88"
                  stroke="#082f49"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M108,88 Q114,94 120,88"
                  stroke="#082f49"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <circle cx="86" cy="88" r="5" fill="#082f49" />
                <circle cx="84" cy="86" r="1.5" fill="#ffffff" />
                <circle cx="114" cy="88" r="5" fill="#082f49" />
                <circle cx="112" cy="86" r="1.5" fill="#ffffff" />
              </>
            )}
            {/* Orange Beak */}
            <polygon points="94,98 106,98 100,108" fill="#f97316" />
            {/* Orange Webbed Feet */}
            <ellipse cx="80" cy="184" rx="14" ry="8" fill="#f97316" />
            <ellipse cx="120" cy="184" rx="14" ry="8" fill="#f97316" />
          </g>
        );

      case "butterfly":
        return (
          <g id="species-butterfly">
            {/* Top Wings */}
            <ellipse cx="60" cy="80" rx="36" ry="48" fill="#c084fc" transform="rotate(-25 60 80)" />
            <circle cx="60" cy="80" r="14" fill="#fae8ff" />
            <ellipse
              cx="140"
              cy="80"
              rx="36"
              ry="48"
              fill="#c084fc"
              transform="rotate(25 140 80)"
            />
            <circle cx="140" cy="80" r="14" fill="#fae8ff" />
            {/* Bottom Wings */}
            <ellipse
              cx="70"
              cy="135"
              rx="26"
              ry="34"
              fill="#a855f7"
              transform="rotate(-15 70 135)"
            />
            <ellipse
              cx="130"
              cy="135"
              rx="26"
              ry="34"
              fill="#a855f7"
              transform="rotate(15 130 135)"
            />
            {/* Slender Body */}
            <ellipse cx="100" cy="120" rx="10" ry="45" fill="#6b21a8" />
            {/* Head */}
            <circle cx="100" cy="72" r="14" fill="#7e22ce" />
            {/* Antennae */}
            <path
              d="M96,62 Q85,40 75,45"
              stroke="#6b21a8"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="75" cy="45" r="3" fill="#f43f5e" />
            <path
              d="M104,62 Q115,40 125,45"
              stroke="#6b21a8"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="125" cy="45" r="3" fill="#f43f5e" />
            {/* Friendly Face */}
            <circle cx="95" cy="72" r="2.5" fill="#ffffff" />
            <circle cx="105" cy="72" r="2.5" fill="#ffffff" />
            <path d="M97,78 Q100,81 103,78" stroke="#ffffff" strokeWidth="1.5" fill="none" />
          </g>
        );

      case "turtle":
        return (
          <g id="species-turtle">
            {/* Flippers */}
            <ellipse
              cx="50"
              cy="105"
              rx="14"
              ry="24"
              fill="#059669"
              transform="rotate(-30 50 105)"
            />
            <ellipse
              cx="150"
              cy="105"
              rx="14"
              ry="24"
              fill="#059669"
              transform="rotate(30 150 105)"
            />
            <ellipse
              cx="60"
              cy="155"
              rx="12"
              ry="20"
              fill="#059669"
              transform="rotate(-40 60 155)"
            />
            <ellipse
              cx="140"
              cy="155"
              rx="12"
              ry="20"
              fill="#059669"
              transform="rotate(40 140 155)"
            />
            <polygon points="98,172 102,172 100,182" fill="#059669" />
            {/* Domed Shell */}
            <ellipse
              cx="100"
              cy="130"
              rx="55"
              ry="48"
              fill="#10b981"
              stroke="#047857"
              strokeWidth="3"
            />
            {/* Shell Hexagon Pattern */}
            <polygon
              points="100,110 115,120 115,138 100,148 85,138 85,120"
              fill="#34d399"
              stroke="#047857"
              strokeWidth="2"
            />
            <line x1="85" y1="120" x2="65" y2="108" stroke="#047857" strokeWidth="2" />
            <line x1="115" y1="120" x2="135" y2="108" stroke="#047857" strokeWidth="2" />
            <line x1="85" y1="138" x2="65" y2="150" stroke="#047857" strokeWidth="2" />
            <line x1="115" y1="138" x2="135" y2="150" stroke="#047857" strokeWidth="2" />
            {/* Peaceful Head */}
            <ellipse cx="100" cy="74" rx="22" ry="26" fill="#10b981" />
            {/* Cheeks */}
            <circle cx="86" cy="78" r="4" fill="#f43f5e" opacity="0.3" />
            <circle cx="114" cy="78" r="4" fill="#f43f5e" opacity="0.3" />
            {/* Eyes */}
            {mood === "sleepy" ? (
              <>
                <path d="M88,72 Q92,75 96,72" stroke="#064e3b" strokeWidth="2" fill="none" />
                <path d="M104,72 Q108,75 112,72" stroke="#064e3b" strokeWidth="2" fill="none" />
              </>
            ) : (
              <>
                <circle cx="92" cy="72" r="3.5" fill="#064e3b" />
                <circle cx="91" cy="71" r="1" fill="#ffffff" />
                <circle cx="108" cy="72" r="3.5" fill="#064e3b" />
                <circle cx="107" cy="71" r="1" fill="#ffffff" />
              </>
            )}
            <path d="M96,82 Q100,85 104,82" stroke="#064e3b" strokeWidth="1.5" fill="none" />
          </g>
        );

      case "owl":
        return (
          <g id="species-owl">
            {/* Body */}
            <ellipse cx="100" cy="130" rx="52" ry="55" fill="#6366f1" />
            {/* Wings */}
            <ellipse
              cx="50"
              cy="130"
              rx="12"
              ry="34"
              fill="#4338ca"
              transform="rotate(10 50 130)"
            />
            <ellipse
              cx="150"
              cy="130"
              rx="12"
              ry="34"
              fill="#4338ca"
              transform="rotate(-10 150 130)"
            />
            {/* Feather Tufts (Ears) */}
            <polygon points="62,65 50,35 80,55" fill="#4338ca" />
            <polygon points="138,65 150,35 120,55" fill="#4338ca" />
            {/* Head */}
            <circle cx="100" cy="90" r="44" fill="#6366f1" />
            {/* Big Expressive Eye Rings */}
            <circle cx="80" cy="90" r="18" fill="#e0e7ff" />
            <circle cx="120" cy="90" r="18" fill="#e0e7ff" />
            {/* Eyes */}
            {mood === "sleepy" ? (
              <>
                <path
                  d="M72,90 Q80,98 88,90"
                  stroke="#312e81"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M112,90 Q120,98 128,90"
                  stroke="#312e81"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <circle cx="80" cy="90" r="9" fill="#312e81" />
                <circle cx="78" cy="87" r="3" fill="#ffffff" />
                <circle cx="120" cy="90" r="9" fill="#312e81" />
                <circle cx="118" cy="87" r="3" fill="#ffffff" />
              </>
            )}
            {/* Hooked Beak */}
            <polygon points="96,96 104,96 100,108" fill="#f59e0b" />
            {/* Chest Flecks */}
            <path d="M92,130 Q100,135 108,130" stroke="#e0e7ff" strokeWidth="2" fill="none" />
            <path d="M88,142 Q100,148 112,142" stroke="#e0e7ff" strokeWidth="2" fill="none" />
            {/* Talons */}
            <circle cx="80" cy="182" r="5" fill="#f59e0b" />
            <circle cx="86" cy="182" r="5" fill="#f59e0b" />
            <circle cx="114" cy="182" r="5" fill="#f59e0b" />
            <circle cx="120" cy="182" r="5" fill="#f59e0b" />
          </g>
        );

      case "otter":
        return (
          <g id="species-otter">
            {/* Streamlined Tail */}
            <path d="M140,155 Q175,175 190,160 Q165,145 140,150 Z" fill="#0f766e" />
            {/* Body */}
            <ellipse cx="100" cy="145" rx="55" ry="46" fill="#0d9488" />
            <ellipse cx="100" cy="150" rx="35" ry="34" fill="#ccfbf1" />
            {/* Round Aquatic Ears */}
            <circle cx="62" cy="72" r="11" fill="#0f766e" />
            <circle cx="138" cy="72" r="11" fill="#0f766e" />
            {/* Head */}
            <circle cx="100" cy="96" r="42" fill="#0d9488" />
            {/* Pale Muzzle */}
            <ellipse cx="100" cy="108" rx="22" ry="15" fill="#ccfbf1" />
            <ellipse cx="100" cy="102" rx="7" ry="5" fill="#134e4a" />
            <path
              d="M96,110 Q100,114 104,110"
              stroke="#134e4a"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            {/* Whiskers */}
            <line
              x1="68"
              y1="106"
              x2="52"
              y2="104"
              stroke="#115e59"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="68"
              y1="112"
              x2="54"
              y2="114"
              stroke="#115e59"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="132"
              y1="106"
              x2="148"
              y2="104"
              stroke="#115e59"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="132"
              y1="112"
              x2="146"
              y2="114"
              stroke="#115e59"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Eyes */}
            {mood === "sleepy" ? (
              <>
                <path
                  d="M80,90 Q85,95 90,90"
                  stroke="#134e4a"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M110,90 Q115,95 120,90"
                  stroke="#134e4a"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <circle cx="84" cy="90" r="5" fill="#134e4a" />
                <circle cx="82" cy="88" r="1.5" fill="#ffffff" />
                <circle cx="116" cy="90" r="5" fill="#134e4a" />
                <circle cx="114" cy="88" r="1.5" fill="#ffffff" />
              </>
            )}
            {/* Paws Resting on Chest */}
            <ellipse cx="88" cy="144" rx="9" ry="7" fill="#115e59" />
            <ellipse cx="112" cy="144" rx="9" ry="7" fill="#115e59" />
            {/* Back Feet */}
            <ellipse cx="76" cy="180" rx="12" ry="9" fill="#0f766e" />
            <ellipse cx="124" cy="180" rx="12" ry="9" fill="#0f766e" />
          </g>
        );

      case "frog":
        return (
          <g id="species-frog">
            {/* Round Lime Body */}
            <ellipse cx="100" cy="142" rx="58" ry="46" fill="#84cc16" />
            {/* Pale Lime Belly */}
            <ellipse cx="100" cy="148" rx="38" ry="32" fill="#ecfccb" />
            {/* Back Folded Legs */}
            <ellipse
              cx="46"
              cy="155"
              rx="16"
              ry="24"
              fill="#65a30d"
              transform="rotate(-20 46 155)"
            />
            <ellipse
              cx="154"
              cy="155"
              rx="16"
              ry="24"
              fill="#65a30d"
              transform="rotate(20 154 155)"
            />
            {/* Head */}
            <ellipse cx="100" cy="100" rx="48" ry="34" fill="#84cc16" />
            {/* Big Raised Eyes on Top */}
            <circle cx="72" cy="75" r="18" fill="#84cc16" />
            <circle cx="72" cy="75" r="13" fill="#ffffff" />
            <circle cx="128" cy="75" r="18" fill="#84cc16" />
            <circle cx="128" cy="75" r="13" fill="#ffffff" />
            {/* Pupils */}
            {mood === "sleepy" ? (
              <>
                <line
                  x1="64"
                  y1="75"
                  x2="80"
                  y2="75"
                  stroke="#365314"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <line
                  x1="120"
                  y1="75"
                  x2="136"
                  y2="75"
                  stroke="#365314"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <circle cx="72" cy="75" r="7" fill="#365314" />
                <circle cx="70" cy="73" r="2" fill="#ffffff" />
                <circle cx="128" cy="75" r="7" fill="#365314" />
                <circle cx="126" cy="73" r="2" fill="#ffffff" />
              </>
            )}
            {/* Cheeks */}
            <circle cx="68" cy="105" r="8" fill="#f43f5e" opacity="0.35" />
            <circle cx="132" cy="105" r="8" fill="#f43f5e" opacity="0.35" />
            {/* Wide Friendly Smile */}
            <path
              d="M78,108 Q100,122 122,108"
              stroke="#365314"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            {/* Front Webbed Feet */}
            <ellipse cx="78" cy="178" rx="10" ry="7" fill="#4d7c0f" />
            <ellipse cx="122" cy="178" rx="10" ry="7" fill="#4d7c0f" />
          </g>
        );

      default:
        return null;
    }
  };

  const renderAccessorySvg = () => {
    switch (accessory) {
      case "flower_crown":
        return (
          <g id="acc-flower-crown" transform="translate(0, -5)">
            <circle cx="75" cy="55" r="8" fill="#f43f5e" />
            <circle cx="75" cy="55" r="3" fill="#fef08a" />
            <circle cx="100" cy="50" r="9" fill="#ec4899" />
            <circle cx="100" cy="50" r="3.5" fill="#fef08a" />
            <circle cx="125" cy="55" r="8" fill="#f43f5e" />
            <circle cx="125" cy="55" r="3" fill="#fef08a" />
            <path d="M68,58 Q100,48 132,58" stroke="#15803d" strokeWidth="2.5" fill="none" />
          </g>
        );

      case "cozy_scarf":
        return (
          <g id="acc-cozy-scarf">
            <path
              d="M72,126 Q100,138 128,126 Q134,140 126,146 Q100,154 74,146 Z"
              fill="#be185d"
              stroke="#831843"
              strokeWidth="1.5"
            />
            {/* Dangling tail of scarf */}
            <path d="M112,138 L118,170 L132,168 L126,136 Z" fill="#9d174d" />
            <line
              x1="118"
              y1="170"
              x2="132"
              y2="168"
              stroke="#fbcfe8"
              strokeWidth="2"
              strokeDasharray="3 2"
            />
          </g>
        );

      case "ribbon_bow":
        return (
          <g id="acc-ribbon-bow">
            <polygon points="100,126 84,116 86,136" fill="#f43f5e" />
            <polygon points="100,126 116,116 114,136" fill="#f43f5e" />
            <circle cx="100" cy="126" r="5" fill="#fda4af" />
          </g>
        );

      case "star_charm":
        return (
          <g id="acc-star-charm">
            <path d="M85,128 Q100,140 115,128" stroke="#d97706" strokeWidth="2" fill="none" />
            <polygon
              points="100,135 102,141 108,142 104,146 105,152 100,148 95,152 96,146 92,142 98,141"
              fill="#fbbf24"
              stroke="#b45309"
              strokeWidth="1"
            />
          </g>
        );

      case "tiny_glasses":
        return (
          <g id="acc-tiny-glasses">
            <circle cx="82" cy="92" r="11" fill="none" stroke="#d97706" strokeWidth="2.5" />
            <circle cx="118" cy="92" r="11" fill="none" stroke="#d97706" strokeWidth="2.5" />
            <line x1="93" y1="92" x2="107" y2="92" stroke="#d97706" strokeWidth="2.5" />
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`inline-block select-none transition-transform duration-300 ${className}`}
      role="img"
      aria-label={`Saheli Companion - ${speciesId} in ${mood} mood`}
    >
      {renderSpeciesSvg()}
      {renderAccessorySvg()}
    </svg>
  );
}
