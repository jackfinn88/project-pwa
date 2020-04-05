import { Component, Input, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { GameScene } from 'src/app/components/game/game-scene';
import { WelcomeScene } from 'src/app/components/game/welcome-scene';
import { ScoreScene } from 'src/app/components/game/score-scene';
import { StarfallGame } from '../game/game.component';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { BehaviorSubject } from 'rxjs';

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
            console.log('Message:', event.data);
            this.onGameWin(event);
        }
    }
    @Input() job: any;
    @Input() collectionId: any;
    @Input() subject: BehaviorSubject<any>;
    gameType;
    fullScreenKey;
    config = {
        title: "Starfall",
        scale: {
            mode: Phaser.Scale.FIT,
            parent: 'game',
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 800,
            height: 600
        },
        scene: [GameScene, WelcomeScene, ScoreScene],
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
    // 
    showGame = false;
    showScore = false;
    showAnim = false;
    showFade = false;
    showFadeEnd = false;

    // 
    timer;
    timerText;
    timerProgress;
    feedback = {};

    gameEndText;

    // console animation
    runAnim = false;
    textarea;
    speed = 100; //Writing speed in milliseconds
    text = 'start ';
    i = 0;

    constructor(private screenOrientation: ScreenOrientation,
        private platform: Platform,
        private modalCtrl: ModalController,
        private _cdr: ChangeDetectorRef) { }

    ngOnInit() {
        this.subject.next({ 'game-started': false, 'game-won': false, 'collectionId': this.collectionId });
        // add fake history to prevent navigation from hardware back button
        if (!window.history.state.modal) {
            const modalState = { modal: true };
            history.pushState(modalState, null);
        }

        // get game type
        if (this.job.game === 1) {
            // starfall
            // tbd: use difficulty setting
            let maxFilesNeeded = 40; // 40
            let minFilesNeeded = 20; // 20
            let maxCompleteNeeded = 15;
            let minCompleteNeeded = 10;

            this.gameType = 'starfall';
            this.text += (this.gameType + '.exe');
            this.uiData = {
                'caught': 0,
                'caughtProgress': 0,
                'lost': 0,
                'lostProgress': 0,
                'corrupt': ((Math.floor(Math.random() * (maxFilesNeeded - minFilesNeeded + 1)) + minFilesNeeded) * 64) / 1000,
                'complete': ((Math.floor(Math.random() * (maxCompleteNeeded - minCompleteNeeded + 1)) + minCompleteNeeded) * 64) / 1000
            };
        } else if (this.job.game === 2) {
            // knightfall
            this.gameType = 'knightfall';
            this.text += (this.gameType + '.exe');
            this.uiData = {};
        }

        this.fullScreenKey = this.getRequestFullScreenKey();
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

    findCanvas() {
        return document.querySelector('#game').querySelector('canvas');
    }

    onGameWin(gameEvent) {
        console.log('onGameWin', gameEvent);
        this.subject.next({ 'game-started': true, 'game-won': true, 'collectionId': this.collectionId });
        if (this.timer) clearInterval(this.timer);
        // show score/hide game
        this.gameEndText = 'SUCCESS';
        this.feedback['header'] = 'Well done!';

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

    onGameLose(gameEvent) {
        console.log('onGameLose', gameEvent);
        this.subject.next({ 'game-started': true, 'game-won': false, 'collectionId': this.collectionId });
        if (this.timer) clearInterval(this.timer);
        // show score/hide game
        this.gameEndText = 'FAILED';
        this.feedback['header'] = 'Unlucky!';

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

    // tbd: remove this
    onTestButtonClick() {
        this.onGameWin(null);
    }

    onPlayButtonClick() {
        if (this.job.game === 1) {
            this.enterFullScreen();
        } else if (this.job.game === 2) {
            this.startAnimation();
        }
        /*this.showGame = true;

        requestAnimationFrame(() => {
            if (this.job.game === 1) {
                this.startStarfall();
            } else if (this.job.game === 2) {
                this.startKnightfall();
            }
        });*/
    }

    onDoneButtonClick() {
        this.closeModal();
    }

    startStarfall() {
        this.game = new StarfallGame(this.config);
        this.game.options = {
            'catch': (this.uiData.corrupt / 64) * 1000,
            'lose': (this.uiData.complete / 64) * 1000
        }

        // subscribe to game-events
        let events = this.game.events;
        events.on('game-event', (event) => {
            if (event.end) {
                if (event.stats.win) {
                    this.onGameWin(event);
                } else {
                    this.onGameLose(event);
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

    startKnightfall() {
        let ui = document.querySelector('.ui-overlay') as HTMLElement;
        ui.style.visibility = 'visible';
        let interval = 100;
        let seconds = 60;
        let duration = seconds * 1000;
        this.timerText = (duration / 1000).toFixed(1);
        this.timerProgress = this.normalise(duration / 1000, seconds);
        this.timer = setInterval(() => {
            if (duration <= 0) {
                this.onGameLose(null);
                return;
            }
            duration -= interval;
            this.timerText = (duration / 1000).toFixed(1);
            this.timerProgress = this.normalise(duration / 1000, seconds);
        }, interval);
    }

    updateUI(gameEvent) {
        console.log('updateUI', gameEvent);

        if (this.job.game < 2) {
            // starfall
            this.uiData.caught = gameEvent.stats.caught;
            this.uiData.caughtProgress = this.normalise(gameEvent.stats.caught, this.game.options.catch);
            this.uiData.lost = gameEvent.stats.lost;
            this.uiData.lostProgress = this.normalise(gameEvent.stats.lost, this.game.options.lose);
        } else {
            // knightfall
        }

        this._cdr.detectChanges();
    }

    normalise(partialValue, totalValue) {
        return ((100 * partialValue) / totalValue) / 100;
    }

    enterFullScreen() {
        // request fullscreen mode to lock screen
        document.documentElement[this.fullScreenKey.request]();
        this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.LANDSCAPE);

        requestAnimationFrame(() => {
            this.startAnimation();
        });
    }

    resize() {
        console.log('resize');
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

    async closeModal() {
        // closing by html button doesn't trigger autoclose overlay service
        // manually navigate from fake history
        history.back();
        await this.modalCtrl.dismiss();
    }

    private getRequestFullScreenKey() {
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

    ngOnDestroy() {
        if (this.showGame || this.showScore) {
            console.log('job started remove it');
            // send data back
        }

        requestAnimationFrame(() => {

            if (this.job.game === 1) {
                window.removeEventListener("resize", this.resize);
                if (this.game) this.game.destroy(true);
                this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);
                let exitFullScreen = 'document.' + this.fullScreenKey.exit + '()';
                eval(exitFullScreen);

                setTimeout(() => {
                    this.screenOrientation.unlock();
                }, 1000);
            }

        });
    }

    // console animation
    startAnimation() {
        this.showAnim = true;
        setTimeout(() => {
            console.log('startAnimation')
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

    count = 0;
    time = 1;
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
        this.time = Math.floor(Math.random() * 4) + 1;
        this.count += this.time;

        setTimeout(() => {
            if (this.runAnim) {
                if (this.i < this.output.length - 1) {
                    this.feedbacker();
                } else {
                    // animation end
                    console.log('animation end');
                    this.runAnim = false;
                    this.subject.next({ 'game-started': true, 'game-won': false, 'collectionId': this.collectionId });
                    setTimeout(() => {
                        this.showGame = true;
                        requestAnimationFrame(() => {
                            if (this.job.game === 1) {
                                // tbd: apply resize
                                this.platform.ready().then(() => {
                                    window.addEventListener("resize", this.resize);
                                });
                                this.startStarfall();
                            } else if (this.job.game === 2) {
                                this.startKnightfall();
                            }
                        });
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
        "BIOS-e820: [mem 0x0000000020200000-0x0000000040003fff] usable",
        "BIOS-e820: [mem 0x0000000040004000-0x0000000040004fff] reserved",
        "BIOS-e820: [mem 0x0000000040005000-0x00000000c9746fff] usable",
        "BIOS-e820: [mem 0x00000000c9747000-0x00000000c9d47fff] ACPI NVS",
        "BIOS-e820: [mem 0x00000000c9d48000-0x00000000c9d4afff] type 20",
        "BIOS-e820: [mem 0x00000000c9d4b000-0x00000000c9d60fff] usable",
        "NX (Execute Disable) protection: active",
        "efi: EFI v2.31 by American Megatrends",
        "efi:  ACPI=0xca852000  ACPI 2.0=0xca852000  SMBIOS=0xca100398 ",
        "efi: mem00: [Conventional Memory|   |  |  |  |   |WB|WT|WC|UC] range=[0x0000000000000000-0x000000000005f000) (0MB)",
        "efi: mem01: [Boot Data          |   |  |  |  |   |WB|WT|WC|UC] range=[0x000000000005f000-0x0000000000060000) (0MB)",
        "efi: mem02: [Conventional Memory|   |  |  |  |   |WB|WT|WC|UC] range=[0x0000000000060000-0x000000000009e000) (0MB)",
        "efi: mem03: [Reserved           |   |  |  |  |   |WB|WT|WC|UC] range=[0x000000000009e000-0x00000000000a0000) (0MB)",
        "efi: mem07: [Reserved           |   |  |  |  |   |WB|WT|WC|UC] range=[0x0000000020000000-0x0000000020200000) (2MB)",
        "efi: mem08: [Conventional Memory|   |  |  |  |   |WB|WT|WC|UC] range=[0x0000000020200000-0x00000000357f2000) (341MB)",
        "efi: mem11: [Reserved           |   |  |  |  |   |WB|WT|WC|UC] range=[0x0000000040004000-0x0000000040005000) (0MB)",
        "efi: mem12: [Conventional Memory|   |  |  |  |   |WB|WT|WC|UC] range=[0x0000000040005000-0x0000000095d21000) (1373MB)",
        "efi: mem13: [Loader Data        |   |  |  |  |   |WB|WT|WC|UC] range=[0x0000000095d21000-0x00000000c7e11000) (800MB)",
        "efi: mem14: [Loader Code        |   |  |  |  |   |WB|WT|WC|UC] range=[0x00000000c7e11000-0x00000000c7f34000) (1MB)",
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
        "reg 3, base: 3584MB, range: 512MB, type UC",
        "reg 4, base: 3328MB, range: 256MB, type UC",
        "total RAM covered: 16302M",
        " gran_size: 1M 	chunk_size: 1M 	num_reg: 10  	lose cover RAM: 242M",
        " gran_size: 1M 	chunk_size: 2M 	num_reg: 10  	lose cover RAM: 242M",
        "*BAD*gran_size: 1M 	chunk_size: 16M 	num_reg: 10  	lose cover RAM: -12M",
        "*BAD*gran_size: 1M 	chunk_size: 32M 	num_reg: 10  	lose cover RAM: -12M",
        " gran_size: 2M 	chunk_size: 2M 	num_reg: 10  	lose cover RAM: 242M",
        " gran_size: 2M 	chunk_size: 4M 	num_reg: 10  	lose cover RAM: 242M",
        "*BAD*gran_size: 2M 	chunk_size: 16M 	num_reg: 10  	lose cover RAM: -12M",
        "*BAD*gran_size: 2M 	chunk_size: 32M 	num_reg: 10  	lose cover RAM: -12M",
        " gran_size: 4M 	chunk_size: 4M 	num_reg: 10  	lose cover RAM: 242M",
        " gran_size: 4M 	chunk_size: 8M 	num_reg: 10  	lose cover RAM: 50M",
        " gran_size: 4M 	chunk_size: 16M 	num_reg: 10  	lose cover RAM: 50M",
        " gran_size: 4M 	chunk_size: 32M 	num_reg: 10  	lose cover RAM: 2M",
        "*BAD*gran_size: 4M 	chunk_size: 512M 	num_reg: 10  	lose cover RAM: -254M",
        " gran_size: 4M 	chunk_size: 1G 	num_reg: 10  	lose cover RAM: 2M",
        "*BAD*gran_size: 4M 	chunk_size: 2G 	num_reg: 10  	lose cover RAM: -1022M",
        " gran_size: 8M 	chunk_size: 8M 	num_reg: 10  	lose cover RAM: 118M",
        " gran_size: 8M 	chunk_size: 16M 	num_reg: 10  	lose cover RAM: 54M",
        " gran_size: 8M 	chunk_size: 32M 	num_reg: 10  	lose cover RAM: 6M",
        "*BAD*gran_size: 8M 	chunk_size: 512M 	num_reg: 10  	lose cover RAM: -250M",
        " gran_size: 2G 	chunk_size: 2G 	num_reg: 3  	lose cover RAM: 1966M",
        "mtrr_cleanup: can not find optimal value",
        "please specify mtrr_gran_size/mtrr_chunk_size",
        "e820: update [mem 0xcbc00000-0xffffffff] usable ==> reserved",
        "e820: last_pfn = 0xcb000 max_arch_pfn = 0x400000000",
        "Scanning 1 areas for low memory corruption",
        "Base memory trampoline at [ffff880000098000] 98000 size 24576",
        "init_memory_mapping: [mem 0x00000000-0x000fffff]",
        " [mem 0x00000000-0x000fffff] page 4k",
        "BRK [0x01fe5000, 0x01fe5fff] PGTABLE",
        "BRK [0x01fe6000, 0x01fe6fff] PGTABLE",
        "BRK [0x01fe7000, 0x01fe7fff] PGTABLE",
        "init_memory_mapping: [mem 0x42f000000-0x42f1fffff]",
        " [mem 0x42f000000-0x42f1fffff] page 2M",
        "BRK [0x01fe8000, 0x01fe8fff] PGTABLE",
        "init_memory_mapping: [mem 0x420000000-0x42effffff]",
        " [mem 0x420000000-0x42effffff] page 2M",
        "init_memory_mapping: [mem 0x400000000-0x41fffffff]",
        " [mem 0x400000000-0x41fffffff] page 2M",
        "init_memory_mapping: [mem 0x00100000-0x1fffffff]",
        " [mem 0x00100000-0x001fffff] page 4k",
        " [mem 0x00200000-0x1fffffff] page 2M",
        "init_memory_mapping: [mem 0x20200000-0x40003fff]",
        " [mem 0x20200000-0x3fffffff] page 2M",
        " [mem 0x40000000-0x40003fff] page 4k",
        "BRK [0x01fe9000, 0x01fe9fff] PGTABLE",
        "BRK [0x01fea000, 0x01feafff] PGTABLE",
        "init_memory_mapping: [mem 0x40005000-0xc9746fff]",
        " [mem 0x40005000-0x401fffff] page 4k",
        " [mem 0x40200000-0xc95fffff] page 2M",
        " [mem 0xc9600000-0xc9746fff] page 4k",
        "init_memory_mapping: [mem 0xc9d4b000-0xc9d60fff]",
        "RAMDISK: [mem 0x357f2000-0x36bf0fff]",
        "ACPI: Early table checksum verification disabled",
        "ACPI: RSDP 0x00000000CA852000 000024 (v02 _ASUS_)",
        "ACPI: XSDT 0x00000000CA852080 000084 (v01 _ASUS_ Notebook 01072009 AMI  00010013)",
        "ACPI: FACP 0x00000000CA865DF0 00010C (v05 _ASUS_ Notebook 01072009 AMI  00010013)",
        "ACPI: DSDT 0x00000000CA852190 013C5A (v02 _ASUS_ Notebook 00000013 INTL 20091112)",
        "ACPI: FACS 0x00000000CA87F080 000040",
        "ACPI: APIC 0x00000000CA865F00 000092 (v03 _ASUS_ Notebook 01072009 AMI  00010013)",
        "ACPI: Local APIC address 0xfee00000",
        "No NUMA configuration found",
        "Faking a node at [mem 0x0000000000000000-0x000000042f1fffff]",
        "NODE_DATA(0) allocated [mem 0x42f1e6000-0x42f1eafff]",
        " [ffffea0000000000-ffffea0010bfffff] PMD -> [ffff88041e800000-ffff88042e7fffff] on node 0",
        "Zone ranges:",
        "  DMA      [mem 0x00001000-0x00ffffff]",
        "  DMA32    [mem 0x01000000-0xffffffff]",
        "  Normal   [mem 0x100000000-0x42f1fffff]",
        "Movable zone start for each node",
        "Early memory node ranges",
        "  node   0: [mem 0x00001000-0x0009dfff]",
        "  node   0: [mem 0x00100000-0x1fffffff]",
        "  node   0: [mem 0x100000000-0x42f1fffff]",
        "Initmem setup node 0 [mem 0x00001000-0x42f1fffff]",
        "On node 0 totalpages: 4165015",
        "  DMA zone: 64 pages used for memmap",
        "  DMA zone: 24 pages reserved",
        "  DMA zone: 3997 pages, LIFO batch:0",
        "  DMA32 zone: 12848 pages used for memmap",
        "  DMA32 zone: 822266 pages, LIFO batch:31",
        "  Normal zone: 52168 pages used for memmap",
        "  Normal zone: 3338752 pages, LIFO batch:31",
        "Reserving Intel graphics stolen memory at 0xcbe00000-0xcfdfffff",
        "ACPI: PM-Timer IO Port: 0x408",
        "ACPI: Local APIC address 0xfee00000",
        "ACPI: LAPIC (acpi_id[0x01] lapic_id[0x00] enabled)",
        "ACPI: LAPIC (acpi_id[0x02] lapic_id[0x02] enabled)",
        "ACPI: LAPIC (acpi_id[0x03] lapic_id[0x04] enabled)",
        "ACPI: LAPIC_NMI (acpi_id[0xff] high edge lint[0x1])",
        "ACPI: IOAPIC (id[0x02] address[0xfec00000] gsi_base[0])",
        "IOAPIC[0]: apic_id 2, version 32, address 0xfec00000, GSI 0-23",
        "ACPI: INT_SRC_OVR (bus 0 bus_irq 0 global_irq 2 dfl dfl)",
        "ACPI: INT_SRC_OVR (bus 0 bus_irq 9 global_irq 9 high level)",
        "ACPI: IRQ0 used by override.",
        "ACPI: IRQ9 used by override.",
        "Using ACPI (MADT) for SMP configuration information",
        "ACPI: HPET id: 0x8086a701 base: 0xfed00000",
        "smpboot: Allowing 8 CPUs, 0 hotplug CPUs",
        "PM: Registered nosave memory: [mem 0x00000000-0x00000fff]",
        "PM: Registered nosave memory: [mem 0x0009e000-0x0009ffff]",
        "PM: Registered nosave memory: [mem 0x000a0000-0x000fffff]",
        "PM: Registered nosave memory: [mem 0x20000000-0x201fffff]",
        "PM: Registered nosave memory: [mem 0x40004000-0x40004fff]",
        "PM: Registered nosave memory: [mem 0xc9747000-0xc9d47fff]",
        "PM: Registered nosave memory: [mem 0xc9d48000-0xc9d4afff]",
        "PM: Registered nosave memory: [mem 0xc9d61000-0xc9d66fff]",
        "PM: Registered nosave memory: [mem 0xc9d69000-0xc9d72fff]",
        "PM: Registered nosave memory: [mem 0xc9f07000-0xc9f0afff]",
        "PM: Registered nosave memory: [mem 0xc9f54000-0xc9f5afff]",
        "e820: [mem 0xcfe00000-0xf7ffffff] available for PCI devices",
        "Booting paravirtualized kernel on bare hardware",
        "setup_percpu: NR_CPUS:256 nr_cpumask_bits:256 nr_cpu_ids:8 nr_node_ids:1",
        "PERCPU: Embedded 31 pages/cpu @ffff88042ee00000 s87040 r8192 d31744 u262144",
        "pcpu-alloc: s87040 r8192 d31744 u262144 alloc=1*2097152",
        "pcpu-alloc: [0] 0 1 2 3 4 5 6 7 ",
        "Built 1 zonelists in Node order, mobility grouping on.  Total pages: 4099911",
        "Policy zone: Normal",
        "Kernel command line: BOOT_IMAGE=/vmlinuz-3.19.0-21-generic.efi.signed root=UUID=14ac372e-6980-4fe8-b247-fae92d54b0c5 ro quiet splash acpi_enforce_resources=lax intel_pstate=enable rcutree.rcu_idle_gp_delay=1 nouveau.runpm=0 vt.handoff=7",
        "PID hash table entries: 4096 (order: 3, 32768 bytes)",
        "xsave: enabled xstate_bv 0x7, cntxt size 0x340 using standard form",
        "AGP: Checking aperture...",
        "AGP: No AGP bridge found",
        "Calgary: detecting Calgary via BIOS EBDA area",
        "Calgary: Unable to locate Rio Grande table in EBDA - bailing!",
        "Memory: 16270208K/16660060K available (8000K kernel code, 1232K rwdata, 3752K rodata, 1408K init, 1300K bss, 389852K reserved, 0K cma-reserved)",
        "SLUB: HWalign=64, Order=0-3, MinObjects=0, CPUs=8, Nodes=1",
        "Hierarchical RCU implementation.",
        "	RCU dyntick-idle grace-period acceleration is enabled.",
        "	RCU restricting CPUs from NR_CPUS=256 to nr_cpu_ids=8.",
        "RCU: Adjusting geometry for rcu_fanout_leaf=16, nr_cpu_ids=8",
        "NR_IRQS:16640 nr_irqs:488 16",
        "	Offload RCU callbacks from all CPUs",
        "	Offload RCU callbacks from CPUs: 0-7.",
        "vt handoff: transparent VT on vt#7",
        "Console: colour dummy device 80x25",
        "console [tty0] enabled",
        "hpet clockevent registered",
        "tsc: Fast TSC calibration using PIT",
        "tsc: Detected 2394.543 MHz processor",
        "Calibrating delay loop (skipped), value calculated using timer frequency.. 4789.08 BogoMIPS (lpj=9578172)",
        "pid_max: default: 32768 minimum: 301",
        "ACPI: Core revision 20141107",
        "ACPI: All ACPI Tables successfully acquired",
        "Security Framework initialized",
        "AppArmor: AppArmor initialized",
        "Yama: becoming mindful.",
        "Dentry cache hash table entries: 2097152 (order: 12, 16777216 bytes)",
        "Inode-cache hash table entries: 1048576 (order: 11, 8388608 bytes)",
        "Mount-cache hash table entries: 32768 (order: 6, 262144 bytes)",
        "Mountpoint-cache hash table entries: 32768 (order: 6, 262144 bytes)",
        "Initializing cgroup subsys memory",
        "Initializing cgroup subsys devices",
        "Initializing cgroup subsys freezer",
        "Initializing cgroup subsys net_cls",
        "Initializing cgroup subsys blkio",
        "Initializing cgroup subsys perf_event",
        "Initializing cgroup subsys net_prio",
        "Initializing cgroup subsys hugetlb",
        "CPU: Physical Processor ID: 0",
        "CPU: Processor Core ID: 0",
        "ENERGY_PERF_BIAS: Set to 'normal', was 'performance'",
        "ENERGY_PERF_BIAS: View and update with x86_energy_perf_policy(8)",
        "mce: CPU supports 9 MCE banks",
        "CPU0: Thermal monitoring enabled (TM1)",
        "process: using mwait in idle threads",
        "Last level iTLB entries: 4KB 512, 2MB 8, 4MB 8",
        "Last level dTLB entries: 4KB 512, 2MB 32, 4MB 32, 1GB 0",
        "Freeing SMP alternatives memory: 32K (ffffffff81e96000 - ffffffff81e9e000)",
        "Ignoring BGRT: invalid status 0 (expected 1)",
        "ftrace: allocating 30086 entries in 118 pages",
        "..TIMER: vector=0x30 apic1=0 pin1=2 apic2=-1 pin2=-1",
        "smpboot: CPU0: Intel(R) Core(TM) i7-3630QM CPU @ 2.40GHz (fam: 06, model: 3a, stepping: 09)",
        "TSC deadline timer enabled",
        "Performance Events: PEBS fmt1+, 16-deep LBR, IvyBridge events, full-width counters, Intel PMU driver.",
        "... version:                3",
        "... bit width:              48",
        "... generic registers:      4",
        "... value mask:             0000ffffffffffff",
        "... max period:             0000ffffffffffff",
        "... fixed-purpose events:   3",
        "... event mask:             000000070000000f",
        "x86: Booting SMP configuration:",
        ".... node  #0, CPUs:      #1",
        "CPU1 microcode updated early to revision 0x1b, date = 2014-05-29",
        "NMI watchdog: enabled on all CPUs, permanently consumes one hw-PMU counter.",
        " #2",
        "CPU2 microcode updated early to revision 0x1b, date = 2014-05-29",
        " #3",
        "CPU3 microcode updated early to revision 0x1b, date = 2014-05-29",
        " #4 #5 #6 #7",
        "x86: Booted up 1 node, 8 CPUs",
        "smpboot: Total of 8 processors activated (38312.68 BogoMIPS)",
        "devtmpfs: initialized",
        "evm: security.selinux",
        "evm: security.SMACK64",
        "evm: security.ima",
        "evm: security.capability",
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
        "PCI: MMCONFIG for domain 0000 [bus 00-3f] at [mem 0xf8000000-0xfbffffff] (base 0xf8000000)",
        "PCI: MMCONFIG at [mem 0xf8000000-0xfbffffff] reserved in E820",
        "PCI: Using configuration type 1 for base access",
        "ACPI: Added _OSI(Module Device)",
        "ACPI: Added _OSI(Processor Device)",
        "ACPI: Added _OSI(3.0 _SCP Extensions)",
        "ACPI: Added _OSI(Processor Aggregator Device)",
        "ACPI : EC: EC description table is found, configuring boot EC",
        "ACPI: Executed 1 blocks of module-level executable AML code",
        "[Firmware Bug]: ACPI: BIOS _OSI(Linux) query ignored",
        "ACPI: Dynamic OEM Table Load:",
        "ACPI: SSDT 0xFFFF88041C049000 000853 (v01 PmRef  Cpu0Cst  00003001 INTL 20051117)",
        "ACPI: Dynamic OEM Table Load:",
        "ACPI: SSDT 0xFFFF88041C7D4C00 000303 (v01 PmRef  ApIst    00003000 INTL 20051117)",
        "ACPI: Dynamic OEM Table Load:",
        "ACPI: SSDT 0xFFFF88041C7DB200 000119 (v01 PmRef  ApCst    00003000 INTL 20051117)",
        "ACPI: Interpreter enabled",
        "ACPI Exception: AE_NOT_FOUND, While evaluating Sleep State [\_S1_] (20141107/hwxface-580)",
        "ACPI Exception: AE_NOT_FOUND, While evaluating Sleep State [\_S2_] (20141107/hwxface-580)",
        "ACPI: (supports S0 S3 S4 S5)",
        "ACPI: Using IOAPIC for interrupt routing",
        "PCI: Using host bridge windows from ACPI; if necessary, use \"pci=nocrs\" and report a bug",
        "ACPI: PCI Root Bridge [PCI0] (domain 0000 [bus 00-3e])",
        "acpi PNP0A08:00: _OSC: OS supports [ExtendedConfig ASPM ClockPM Segments MSI]",
        "acpi PNP0A08:00: _OSC: platform does not support [PCIeHotplug PME]",
        "acpi PNP0A08:00: _OSC: OS now controls [AER PCIeCapability]",
        "acpi PNP0A08:00: FADT indicates ASPM is unsupported, using BIOS configuration",
        "PCI host bridge to bus 0000:00",
        "pci_bus 0000:00: root bus resource [bus 00-3e]",
        "pci_bus 0000:00: root bus resource [io  0x0000-0x0cf7]",
        "pci_bus 0000:00: root bus resource [io  0x0d00-0xffff]",
        "pci 0000:00:00.0: [8086:0154] type 00 class 0x060000",
        "pci 0000:00:01.0: [8086:0151] type 01 class 0x060400",
        "pci 0000:00:01.0: PME# supported from D0 D3hot D3cold",
        "pci 0000:00:01.0: System wakeup disabled by ACPI",
        "pci 0000:00:02.0: [8086:0166] type 00 class 0x030000",
        "pci 0000:00:02.0: reg 0x10: [mem 0xf7400000-0xf77fffff 64bit]",
        "pci 0000:00:02.0: reg 0x18: [mem 0xd0000000-0xdfffffff 64bit pref]",
        "ACPI: PCI Interrupt Link [LNKA] (IRQs 3 4 5 6 7 10 11 12) *0, disabled.",
        "ACPI: PCI Interrupt Link [LNKB] (IRQs 3 4 5 6 7 10 12) *0, disabled.",
        "ACPI: Enabled 4 GPEs in block 00 to 3F",
        "ACPI : EC: GPE = 0x19, I/O: command/status = 0x66, data = 0x62",
        "vgaarb: setting as boot device: PCI:0000:00:02.0",
        "vgaarb: device added: PCI:0000:00:02.0,decodes=io+mem,owns=io+mem,locks=none",
        "vgaarb: device added: PCI:0000:01:00.0,decodes=io+mem,owns=none,locks=none",
        "vgaarb: loaded",
        "vgaarb: bridge control possible 0000:01:00.0",
        "vgaarb: no bridge control possible 0000:00:02.0",
        "SCSI subsystem initialized",
        "libata version 3.00 loaded.",
        "ACPI: bus type USB registered",
        "usbcore: registered new interface driver usbfs",
        "usbcore: registered new interface driver hub",
        "usbcore: registered new device driver usb",
        "PCI: Using ACPI for IRQ routing",
        "PCI: pci_cache_line_size set to 64 bytes",
        "e820: reserve RAM buffer [mem 0x0009e000-0x0009ffff]",
        "e820: reserve RAM buffer [mem 0x40004000-0x43ffffff]",
        "e820: reserve RAM buffer [mem 0xc9747000-0xcbffffff]",
        "e820: reserve RAM buffer [mem 0xc9d61000-0xcbffffff]",
        "e820: reserve RAM buffer [mem 0x42f200000-0x42fffffff]",
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
        "system 00:01: [io  0x1000-0x100f] has been reserved",
        "system 00:01: Plug and Play ACPI device, IDs PNP0c02 (active)",
        "ieee80211 phy0: Selected rate control algorithm 'iwl-agn-rs'",
        "asus_wmi: ASUS WMI generic driver loaded",
        "asus_wmi: Initialization: 0x1",
        "asus_wmi: BIOS WMI version: 7.9",
        "asus_wmi: SFUN value: 0x6a0877",
        "input: Asus WMI hotkeys as /devices/platform/asus-nb-wmi/input/input12",
        "uvcvideo: Found UVC 1.00 device ASUS USB2.0 Webcam (1bcf:2883)",
        "Adding 16760828k swap on /dev/sda5.  Priority:-1 extents:1 across:16760828k SSFS",
        "ACPI: Video Device [PEGP] (multi-head: yes  rom: yes  post: no)",
        "input: Video Bus as /devices/LNXSYSTM:00/LNXSYBUS:00/PNP0A08:00/device:02/LNXVIDEO:00/input/input13",
        "ACPI: Video Device [GFX0] (multi-head: yes  rom: no  post: no)",
        "input: Video Bus as /devices/LNXSYSTM:00/LNXSYBUS:00/PNP0A08:00/LNXVIDEO:01/input/input14",
        "[drm] Initialized i915 1.6.0 20141121 for 0000:00:02.0 on minor 0",
        "input: ASUS USB2.0 Webcam as /devices/pci0000:00/0000:00:1a.0/usb3/3-1/3-1.3/3-1.3:1.0/input/input15",
        "usbcore: registered new interface driver uvcvideo",
        "USB Video Class driver (1.1.1)",
        "sound hdaudioC0D0: autoconfig: line_outs=2 (0x14/0x16/0x0/0x0/0x0) type:speaker",
        "sound hdaudioC0D0:    speaker_outs=0 (0x0/0x0/0x0/0x0/0x0)",
        "sound hdaudioC0D0:    hp_outs=1 (0x21/0x0/0x0/0x0/0x0)",
        "sound hdaudioC0D0:    mono: mono_out=0x0",
        "sound hdaudioC0D0:    dig-out=0x1e/0x0",
        "sound hdaudioC0D0:    inputs:",
        "sound hdaudioC0D0:      Internal Mic=0x19",
        "sound hdaudioC0D0:      Mic=0x18",
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
        "EXT4-fs (sda7): mounted filesystem with ordered data mode. Opts: (null)",
        "audit: type=1400 audit(1436478108.432:2): apparmor=\"STATUS\" operation=\"profile_load\" profile=\"unconfined\" name=\"/usr/lib/lightdm/lightdm-guest-session\" pid=728 comm=\"apparmor_parser\"",
        "bbswitch: version 0.7",
        "bbswitch: Found integrated VGA device 0000:00:02.0: \_SB_.PCI0.GFX0",
        "bbswitch: Found discrete VGA device 0000:01:00.0: \_SB_.PCI0.PEG0.PEGP",
        "ACPI Warning: \_SB_.PCI0.PEG0.PEGP._DSM: Argument #4 type mismatch - Found [Buffer], ACPI requires [Package] (20141107/nsarguments-95)",
        "bbswitch: detected an Optimus _DSM function",
        "pci 0000:01:00.0: enabling device (0000 -> 0003)",
        "bbswitch: Succesfully loaded. Discrete card 0000:01:00.0 is on",
        "bbswitch: disabling discrete graphics",
        "ACPI Warning: \_SB_.PCI0.PEG0.PEGP._DSM: Argument #4 type mismatch - Found [Buffer], ACPI requires [Package] (20141107/nsarguments-95)",
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
        "iwlwifi 0000:03:00.0 wlan0: disabling HT/VHT due to WEP/TKIP use",
        "iwlwifi 0000:03:00.0 wlan0: disabling HT as WMM/QoS is not supported by the AP",
        "iwlwifi 0000:03:00.0 wlan0: disabling VHT as WMM/QoS is not supported by the AP",
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