import { Component, Input, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { GameScene } from 'src/app/components/game/game-scene';
import { BlitzGame } from '../game/game.component';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { BehaviorSubject } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
    templateUrl: 'game-modal.component.html',
    styleUrls: ['./game-modal.component.scss']
})
export class GameModalComponent implements OnInit, OnDestroy {
    @HostListener('window:message', ['$event'])
    onMessage(event) {
        if (event.origin !== "https://jlf40.brighton.domains") {
            return false;
        } else {
            let data = JSON.parse(event.data);
            if (data.rotate) {
                this.onFallproofRotate();
            } else if (data.win) {
                this.onGameWin();
            }
        }
    }
    @Input() job: any;
    @Input() collectionId: any;
    @Input() subject: BehaviorSubject<any>;
    @Input() player: any;
    gameType;
    fullScreenKey;
    config = {
        title: "Blitz",
        scale: {
            mode: Phaser.Scale.FIT,
            parent: 'game',
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 800,
            height: 600
        },
        scene: [GameScene],
        physics: {
            default: "arcade",
            arcade: {
                debug: false
            }
        },
        backgroundColor: "#000000",
    };
    game;
    uiData;
    canvas;
    math = Math;
    showGame = false;
    showScore = false;
    showAnim = false;
    showFade = false;
    showFadeEnd = false;
    timer;
    timerText;
    timerProgress;
    feedback = {};
    gameEndText;
    rotations;
    iframeSrc: SafeResourceUrl = 'https://jlf40.brighton.domains/ci301/app/fallproof/index.html';
    gameOver = false;


    constructor(
        private screenOrientation: ScreenOrientation,
        private platform: Platform,
        private modalCtrl: ModalController,
        private _cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.subject.next({ 'game-started': false, 'game-won': false, 'collectionId': this.collectionId });
        // add fake history to prevent navigation from hardware back button
        if (!window.history.state.modal) {
            const modalState = { modal: true };
            history.pushState(modalState, null);
        }

        // get game type
        if (this.job.gameIdx === 1) {
            // blitz
            this.uiData = {
                'caught': 0,
                'caughtProgress': 0,
                'lost': 0,
                'lostProgress': 0,
                'corrupt': 0,
                'complete': 0
            };
            this.gameType = 'blitz';
            this.text += (this.gameType + '.exe');
        } else if (this.job.gameIdx === 2) {
            // fallproof
            this.gameType = 'fallproof';
            this.text += (this.gameType + '.exe');
        }

        // get request key
        this.fullScreenKey = this.getRequestFullScreenKey();
    }

    onPlayButtonClick() {
        // move to fullscreen for maximum real estate
        this.enterFullScreen();

        // lock orientations
        if (this.job.gameIdx === 1) {
            // blitz
            this.lockOrientation(this.screenOrientation.ORIENTATIONS.LANDSCAPE);
        } else if (this.job.gameIdx === 2) {
            // fallproof
            this.lockOrientation(this.screenOrientation.ORIENTATIONS.PORTRAIT);
        }

        // begin starting animation
        requestAnimationFrame(() => {
            this.startAnimation();
        })
    }

    // close modal when done is clicked
    onDoneButtonClick() {
        this.closeModal();
    }

    onGameWin() {
        // update map-view subject so they know what happened immediately
        this.subject.next({ 'game-started': true, 'game-won': true, 'collectionId': this.collectionId });

        // clear fallproof timer if running
        if (this.timer) clearInterval(this.timer);

        // show score/hide game
        this.gameEndText = 'SUCCESS';
        this.feedback['header'] = 'Well done!';
        this.feedback['message'] = 'You smashed it!';
        this.feedback["won"] = true;

        // show fade animation
        this.showFade = true;

        // hide fade
        setTimeout(() => {
            this.showFadeEnd = true;
            // hide game/show score
            setTimeout(() => {
                this.showGame = false;
                this.showScore = true;
            }, 2500);
        }, 3000);
    }

    onGameLose() {
        // update map-view subject so they know what happened immediately
        this.subject.next({ 'game-started': true, 'game-won': false, 'collectionId': this.collectionId });

        if (this.timer) clearInterval(this.timer);
        // show score/hide game
        this.gameEndText = 'FAILED';
        this.feedback['header'] = 'Unlucky!';
        this.feedback['message'] = 'Try harder next time!';
        this.feedback["won"] = false;

        // show fade animation
        this.showFade = true;

        // hide fade
        setTimeout(() => {
            this.showFadeEnd = true;
            // hide game/show score
            setTimeout(() => {
                this.showGame = false;
                this.showScore = true;
            }, 2500);
        }, 3000);
    }

    // setup game and begin
    startBlitz() {
        this.game = new BlitzGame(this.config);

        // base data for random ranges
        let maxPacketsCatch = 30;
        let minPacketsCatch = 24;
        let maxPacketsLose = 16;
        let minPacketsLose = 12;

        // total packets needed to corrupt or complete transfer
        let corrupt = Math.floor(Math.random() * (maxPacketsCatch - minPacketsCatch + 1)) + minPacketsCatch;
        let complete = Math.floor(Math.random() * (maxPacketsLose - minPacketsLose + 1)) + minPacketsLose;

        // get increment added when data packet is destroyed, from upgrade level
        let upgrade01Level = parseInt(this.player["game-data"].blitz.upgrades["0"].level, 10);
        let packetsPerHit = parseInt(this.player["game-data"].blitz.upgrades["0"].active, 10) ? upgrade01Level + 1 : 1;

        // get data packet velocity, from upgrade level
        let upgrade02Level = parseInt(this.player["game-data"].blitz.upgrades["1"].level, 10);
        let speedBaseValue = 325;
        let speed = speedBaseValue - (parseInt(this.player["game-data"].blitz.upgrades["1"].active, 10) ? upgrade02Level * 75 : 0);

        this.game.options = {
            'catch': corrupt,
            'lose': complete,
            'packetVelocity': speed,
            'packetsPerHit': packetsPerHit
        }

        this.uiData = {
            'caught': 0,
            'caughtProgress': 0,
            'lost': 0,
            'lostProgress': 0,
            'corrupt': (corrupt * 128) / 1000,
            'complete': (complete * 128) / 1000
        };

        // subscribe to game-events
        let events = this.game.events;
        events.on('game-event', (event) => {
            if (event.end) {
                if (event.stats.win) {
                    this.onGameWin();
                } else {
                    this.onGameLose();
                }
            } else {
                this.updateUI(event);
            }
        });
        events.on('first-update', (event) => {
            setTimeout(() => {
                this.setUIStyle();
            }, 600);
        });
    }

    // setup game and begin - fallproof is controlled by timer
    startFallproof() {
        // get ui element to update
        let ui = document.querySelector('.ui-overlay') as HTMLElement;
        ui.style.visibility = 'visible';

        // get time allowed for game
        let upgrade01Level = parseInt(this.player["game-data"].fallproof.upgrades["0"].level, 10);
        let timeIncrementValue = 10;
        let baseTime = 30;

        // setup time allowed from upgrades
        let interval = 100; // modify duration at 1/10s for speedy ui timer
        let seconds = baseTime + (parseInt(this.player["game-data"].fallproof.upgrades["0"].active, 10) ? upgrade01Level * timeIncrementValue : 0);
        let duration = seconds * 1000;

        // instantiate ui timer binding
        this.timerText = (duration / 1000).toFixed(1);
        this.timerProgress = this.normalise(duration / 1000, seconds);

        // get rotations allowed for game
        let upgrade02Level = parseInt(this.player["game-data"].fallproof.upgrades["1"].level, 10);
        let rotationIncrementValue = 4;
        let baseRotations = 8;
        this.rotations = baseRotations + (parseInt(this.player["game-data"].fallproof.upgrades["1"].active, 10) ? upgrade02Level * rotationIncrementValue : 0);

        // update iframe src - game will pick up rotations from href
        this.iframeSrc = this.iframeSrc + '?rotations=' + this.rotations;

        // start timer
        this.timer = setInterval(() => {
            if (duration <= 0) {
                // end game at 0
                this.onGameLose();
                return;
            }
            // update ui
            duration -= interval;
            this.timerText = (duration / 1000).toFixed(1);
            this.timerProgress = this.normalise(duration / 1000, seconds);
        }, interval);
    }

    // decrement rotations for ui data binding
    onFallproofRotate() {
        this.rotations--;
    }

    findCanvas() {
        return document.querySelector('#game').querySelector('canvas');
    }

    setUIStyle() {
        this.canvas = this.findCanvas();
        if (this.canvas) {
            let ui = document.querySelector('.ui-overlay') as HTMLElement;
            let margin = window.getComputedStyle(this.canvas).marginLeft;
            ui.style.width = margin;
            ui.style.visibility = 'visible';
        } else {
            requestAnimationFrame(() => {
                this.setUIStyle();
            })
        }
    }

    // update data shown to user
    updateUI(gameEvent) {
        if (this.job.gameIdx === 1) {
            // blitz
            this.uiData.caught = gameEvent.stats.caught;
            this.uiData.caughtProgress = this.normalise(gameEvent.stats.caught, this.game.options.catch);
            this.uiData.lost = gameEvent.stats.lost;
            this.uiData.lostProgress = this.normalise(gameEvent.stats.lost, this.game.options.lose);
        } else if (this.job.gameIdx === 2) {
            // fallproof
            this.uiData.rotations = gameEvent.rotations;
        }

        this._cdr.detectChanges();
    }

    getRequestFullScreenKey() {
        let go = 'requestFullscreen';
        let leave = 'exitFullscreen';
        if ('mozRequestFullScreen' in document.documentElement) {
            go = 'mozRequestFullScreen';
            leave = 'mozCancelFullScreen';
        } else if ('webkitRequestFullscreen' in document.documentElement) {
            go = 'webkitRequestFullscreen';
            leave = 'webkitExitFullscreen';
        } else if ('msRequestFullscreen' in document.documentElement) {
            go = 'msRequestFullscreen';
            leave = 'msExitFullscreen';
        }
        return { request: go, exit: leave };
    }

    // request fullscreen mode to lock screen orientation
    enterFullScreen() {
        document.documentElement[this.fullScreenKey.request]();
    }

    // get exit fn and evaluate (tbd: check for alternative)
    exitFullEcreen() {
        let exitFullScreen = 'document.' + this.fullScreenKey.exit + '()';
        eval(exitFullScreen);
    }

    // lock screen to given orientation
    lockOrientation(orientation) {
        this.screenOrientation.lock(orientation);
    }

    // return % as 0-1 value
    normalise(partialValue, totalValue) {
        return ((100 * partialValue) / totalValue) / 100;
    }

    // ensure canvas fits screen and maintains aspect ratio
    resize() {
        let canvas = document.querySelector("canvas");
        let windowWidth = window.innerWidth;
        let windowHeight = window.innerHeight;
        let windowRatio = windowWidth / windowHeight;
        let gameRatio = (this.config.scale.width as number) / (this.config.scale.height as number);

        if (windowRatio < gameRatio) {
            canvas.style.width = windowWidth + "px";
            canvas.style.height = (windowWidth / gameRatio) + "px";
        }
        else {
            canvas.style.width = (windowHeight * gameRatio) + "px";
            canvas.style.height = windowHeight + "px";
        }
    }

    // close this modal component
    async closeModal() {
        // closing by header button doesn't trigger autoclose overlay service
        // manually navigate from fake history
        history.back();
        await this.modalCtrl.dismiss();
    }

    ngOnDestroy() {
        requestAnimationFrame(() => {
            // remove listeners and destroy game
            if (this.job.gameIdx === 1) {
                window.removeEventListener("resize", this.resize);
                if (this.game) this.game.destroy(true);
            }

            // force portrait and exit fullscreen
            this.lockOrientation(this.screenOrientation.ORIENTATIONS.PORTRAIT);
            this.exitFullEcreen();

            // give user time to rotate device back to portrait
            setTimeout(() => {
                this.screenOrientation.unlock();
            }, 2000);
        });
    }

    // console animation
    runAnim = false;
    textarea;
    speed = 30; // typing speed (ms)
    text = 'start ';
    i = 0;
    count = 0;
    time = 1;

    startAnimation() {
        this.showAnim = true;
        setTimeout(() => {
            this.textarea = document.querySelector('.load');
            this.runAnim = true;
            this.runner();
        }, 1000);
    }

    runner() {
        this.textarea.append(this.text.charAt(this.i));
        this.i++;
        setTimeout(() => {
            if (this.i < this.text.length)
                this.runner();
            else {
                this.textarea.insertAdjacentHTML('beforeend', "<br>");
                this.i = 0;
                setTimeout(() => { this.feedbacker(); }, 1000);
            }
        }, Math.floor(Math.random() * 220) + 50);
    }

    feedbacker() {
        this.textarea.insertAdjacentHTML('beforeend', "[    " + this.count / 1000 + "] " + this.output[this.i] + "<br>");
        if (this.time % 2 == 0) {
            this.i++;
            this.textarea.insertAdjacentHTML('beforeend', "[    " + this.count / 1000 + "] " + this.output[this.i] + "<br>");
        }
        if (this.time == 3) {
            this.i++;
            this.textarea.insertAdjacentHTML('beforeend', "[    " + this.count / 1000 + "] " + this.output[this.i] + "<br>");
            this.i++;
            this.textarea.insertAdjacentHTML('beforeend', "[    " + this.count / 1000 + "] " + this.output[this.i] + "<br>");
            this.i++;
            this.textarea.insertAdjacentHTML('beforeend', "[    " + this.count / 1000 + "] " + this.output[this.i] + "<br>");
        }
        this.textarea.scrollIntoView(false);
        this.i++;
        this.time = (Math.floor(Math.random() * 4) + 1) + this.speed;
        this.count += this.time;
        setTimeout(() => {
            if (this.runAnim) {
                if (this.i < this.output.length - 1) {
                    this.feedbacker();
                } else {
                    this.runAnim = false;
                    this.subject.next({ 'game-started': true, 'game-won': false, 'collectionId': this.collectionId });
                    setTimeout(() => {
                        requestAnimationFrame(() => {
                            if (this.job.gameIdx === 1) {
                                // apply resize listener
                                this.platform.ready().then(() => {
                                    window.addEventListener("resize", this.resize);
                                });
                                this.startBlitz();
                            } else if (this.job.gameIdx === 2) {
                                this.startFallproof();
                            }
                        });
                        this.showGame = true;
                    }, 1000);
                }
            }
        }, this.time);
    }

    output = ["CPU0 microcode updated early to revision 0x1b",
        "Initializing cgroup subsys cpuset",
        "Initializing cgroup subsys cpu",
        "Initializing cgroup subsys cpuacct",
        "Command line: BOOT_IMAGE=/vmlinuz-3.19.0-21-generic.efi.signed root=UUID=14ac372e-6980-4fe8-b247-fae92d54b0c5 ro quiet splash acpi_enforce_resources=lax intel_pstate=enable rcutree.rcu_idle_gp_delay=1 nouveau.runpm=0 vt.handoff=7",
        "KERNEL supported cpus:",
        "  Intel GenuineIntel",
        "  AMD AuthenticAMD",
        "  Centaur CentaurHauls",
        "e820: BIOS-provided physical RAM map:",
        "BIOS-e820: [mem 0x0000000000000000-0x000000000009dfff] usable",
        "BIOS-e820: [mem 0x000000000009e000-0x000000000009ffff] reserved",
        "BIOS-e820: [mem 0x0000000000100000-0x000000001fffffff] usable",
        "BIOS-e820: [mem 0x0000000020000000-0x00000000201fffff] reserved",
        "BIOS-e820: [mem 0x0000000040005000-0x00000000c9746fff] usable",
        "BIOS-e820: [mem 0x00000000c9747000-0x00000000c9d47fff] ACPI NVS",
        "BIOS-e820: [mem 0x00000000c9d48000-0x00000000c9d4afff] type 20",
        "BIOS-e820: [mem 0x00000000c9d4b000-0x00000000c9d60fff] usable",
        "NX (Execute Disable) protection: active",
        "efi: EFI v2.31 by American Megatrends",
        "efi:  ACPI=0xca852000  ACPI 2.0=0xca852000  SMBIOS=0xca100398 ",
        "SMBIOS 2.7 present.",
        "DMI: ASUSTeK COMPUTER INC. N56VZ/N56VZ, BIOS N56VZ.217 05/22/2013",
        "e820: update [mem 0x00000000-0x00000fff] usable ==> reserved",
        "e820: remove [mem 0x000a0000-0x000fffff] usable",
        "AGP: No AGP bridge found",
        "e820: last_pfn = 0x42f200 max_arch_pfn = 0x400000000",
        "MTRR default type: uncachable",
        "MTRR fixed ranges enabled:",
        "  00000-9FFFF write-back",
        "  A0000-DFFFF uncachable",
        "  E0000-FFFFF write-protect",
        "MTRR variable ranges enabled:",
        "  0 base 000000000 mask C00000000 write-back",
        "  1 base 400000000 mask FE0000000 write-back",
        "  2 base 420000000 mask FF0000000 write-back",
        "  3 base 0E0000000 mask FE0000000 uncachable",
        "  4 base 0D0000000 mask FF0000000 uncachable",
        "PAT configuration [0-7]: WB  WC  UC- UC  WB  WC  UC- UC  ",
        "original variable MTRRs",
        "reg 0, base: 0GB, range: 16GB, type WB",
        "reg 1, base: 16GB, range: 512MB, type WB",
        "reg 2, base: 16896MB, range: 256MB, type WB",
        "total RAM covered: 16302M",
        "mtrr_cleanup: can not find optimal value",
        "please specify mtrr_gran_size/mtrr_chunk_size",
        "e820: update [mem 0xcbc00000-0xffffffff] usable ==> reserved",
        "e820: last_pfn = 0xcb000 max_arch_pfn = 0x400000000",
        "Scanning 1 areas for low memory corruption",
        "Base memory trampoline at [ffff880000098000] 98000 size 24576",
        "init_memory_mapping: [mem 0x00000000-0x000fffff]",
        "init_memory_mapping: [mem 0xc9d4b000-0xc9d60fff]",
        "RAMDISK: [mem 0x357f2000-0x36bf0fff]",
        "ACPI: Early table checksum verification disabled",
        "ACPI: RSDP 0x00000000CA852000 000024 (v02 _ASUS_)",
        "RCU: Adjusting geometry for rcu_fanout_leaf=16, nr_cpu_ids=8",
        "NR_IRQS:16640 nr_irqs:488 16",
        "	Offload RCU callbacks from all CPUs",
        "	Offload RCU callbacks from CPUs: 0-7.",
        "vt handoff: transparent VT on vt#7",
        "Console: colour dummy device 80x25",
        "hpet clockevent registered",
        "tsc: Fast TSC calibration using PIT",
        "tsc: Detected 2394.543 MHz processor",
        "pid_max: default: 32768 minimum: 301",
        "ACPI: Core revision 20141107",
        "ACPI: All ACPI Tables successfully acquired",
        "Security Framework initialized",
        "AppArmor: AppArmor initialized",
        "Mountpoint-cache hash table entries: 32768 (order: 6, 262144 bytes)",
        "CPU: Physical Processor ID: 0",
        "CPU: Processor Core ID: 0",
        "ENERGY_PERF_BIAS: Set to 'normal', was 'performance'",
        "ENERGY_PERF_BIAS: View and update with x86_energy_perf_policy(8)",
        "mce: CPU supports 9 MCE banks",
        "CPU0: Thermal monitoring enabled (TM1)",
        "PM: Registering ACPI NVS region [mem 0xc9747000-0xc9d47fff] (6295552 bytes)",
        "PM: Registering ACPI NVS region [mem 0xca602000-0xca881fff] (2621440 bytes)",
        "PM: Registering ACPI NVS region [mem 0xca888000-0xca8cafff] (274432 bytes)",
        "pinctrl core: initialized pinctrl subsystem",
        "RTC time:  5:41:44, date: 07/10/15",
        "NET: Registered protocol family 16",
        "cpuidle: using governor ladder",
        "cpuidle: using governor menu",
        "ACPI FADT declares the system doesn't support PCIe ASPM, so disable it",
        "ACPI: bus type PCI registered",
        "acpiphp: ACPI Hot Plug PCI Controller Driver version: 0.5",
        "PCI: MMCONFIG at [mem 0xf8000000-0xfbffffff] reserved in E820",
        "PCI: Using configuration type 1 for base access",
        "SCSI subsystem initialized",
        "libata version 3.00 loaded.",
        "ACPI: bus type USB registered",
        "usbcore: registered new interface driver usbfs",
        "usbcore: registered new interface driver hub",
        "usbcore: registered new device driver usb",
        "NetLabel: Initializing",
        "NetLabel:  domain hash size = 128",
        "NetLabel:  protocols = UNLABELED CIPSOv4",
        "NetLabel:  unlabeled traffic allowed by default",
        "hpet0: at MMIO 0xfed00000, IRQs 2, 8, 0, 0, 0, 0, 0, 0",
        "hpet0: 8 comparators, 64-bit 14.318180 MHz counter",
        "Switched to clocksource hpet",
        "AppArmor: AppArmor Filesystem Enabled",
        "pnp: PnP ACPI init",
        "system 00:00: [mem 0xfed40000-0xfed44fff] has been reserved",
        "system 00:00: Plug and Play ACPI device, IDs PNP0c01 (active)",
        "system 00:01: [io  0x0680-0x069f] has been reserved",
        "system 00:01: Plug and Play ACPI device, IDs PNP0c02 (active)",
        "ieee80211 phy0: Selected rate control algorithm 'iwl-agn-rs'",
        "asus_wmi: ASUS WMI generic driver loaded",
        "asus_wmi: Initialization: 0x1",
        "asus_wmi: BIOS WMI version: 7.9",
        "asus_wmi: SFUN value: 0x6a0877",
        "input: Asus WMI hotkeys as /devices/platform/asus-nb-wmi/input/input12",
        "uvcvideo: Found UVC 1.00 device ASUS USB2.0 Webcam (1bcf:2883)",
        "Adding 16760828k swap on /dev/sda5.  Priority:-1 extents:1 across:16760828k SSFS",
        "usbcore: registered new interface driver uvcvideo",
        "fbcon: inteldrmfb (fb0) is primary device",
        "Console: switching to colour frame buffer device 240x67",
        "i915 0000:00:02.0: fb0: inteldrmfb frame buffer device",
        "i915 0000:00:02.0: registered panic notifier",
        "input: HDA Intel PCH Mic as /devices/pci0000:00/0000:00:1b.0/sound/card0/input16",
        "input: HDA Intel PCH Headphone as /devices/pci0000:00/0000:00:1b.0/sound/card0/input17",
        "asus_wmi: Backlight controlled by ACPI video driver",
        "EXT4-fs (sda4): re-mounted. Opts: errors=remount-ro",
        "systemd-journald[346]: Received request to flush runtime journal from PID 1",
        "EXT4-fs (sda2): mounted filesystem with ordered data mode. Opts: (null)",
        "bbswitch: version 0.7",
        "bbswitch: Found integrated VGA device 0000:00:02.0: \_SB_.PCI0.GFX0",
        "bbswitch: Found discrete VGA device 0000:01:00.0: \_SB_.PCI0.PEG0.PEGP",
        "bbswitch: detected an Optimus _DSM function",
        "pci 0000:01:00.0: enabling device (0000 -> 0003)",
        "bbswitch: Succesfully loaded. Discrete card 0000:01:00.0 is on",
        "bbswitch: disabling discrete graphics",
        "Bluetooth: BNEP (Ethernet Emulation) ver 1.3",
        "Bluetooth: BNEP filters: protocol multicast",
        "Bluetooth: RFCOMM ver 1.11",
        "iwlwifi 0000:03:00.0: L1 Enabled - LTR Disabled",
        "iwlwifi 0000:03:00.0: Radio type=0x2-0x0-0x0",
        "iwlwifi 0000:03:00.0: L1 Enabled - LTR Disabled",
        "iwlwifi 0000:03:00.0: Radio type=0x2-0x0-0x0",
        "wlan0: authenticate with 00:90:cc:ea:f4:16",
        "wlan0: send auth to 00:90:cc:ea:f4:16 (try 1/3)",
        "wlan0: authenticated",
        "wlan0: associate with 00:90:cc:ea:f4:16 (try 1/3)",
        "wlan0: RX AssocResp from 00:90:cc:ea:f4:16 (capab=0x431 status=0 aid=3)",
        "wlan0: associated",
        "vboxdrv: Found 8 processor cores.",
        "vboxdrv: fAsync=0 offMin=0x165 offMax=0x24ab",
        "vboxdrv: TSC mode is 'synchronous', kernel timer mode is 'normal'.",
        "vboxdrv: Successfully loaded version 4.3.26_Ubuntu (interface 0x001a000a).",
        "vboxpci: IOMMU not found (not registered)",
        "ip_tables: (C) 2000-2006 Netfilter Core Team",
        "ip6_tables: (C) 2000-2006 Netfilter Core Team",
        "Ebtables v2.0 registered",
        "device virbr0-nic entered promiscuous mode",
        "nf_conntrack version 0.5.0 (16384 buckets, 65536 max)",
        "virbr0: port 1(virbr0-nic) entered listening state",
        "Initialising...", ""];
}