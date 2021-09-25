const REF_HASH = "c1a551ca1c0deea5efea51b1e1dea112ed1dea0a5150f5e11ab1e50c1a15eed5";
const CUR_VERSION = 1;
const MSG = {
    VALIDATION_DEMAND: "dv",
    VALIDATION_ACCEPT: "av",
    PAYMENT: "p",
    PAYMENT_REFUSED: "pr",
    SIGN_DEMAND: "ds",
    SIGN_ACCEPT: "as"
}

async function createAccountFromModal() {
    let birthdate = document.getElementById("new-account-modal-birthdate").value;
    // DD/MM/YYYY to YYYY-MM-DD
    birthdate = birthdate.slice(6,10) + "-" + birthdate.slice(3,5) + "-" + birthdate.slice(0,2);
    const pwd = document.getElementById("new-account-modal-password").value;
    const pwd_conf = document.getElementById("new-account-modal-password-confirmation").value;
    if (pwd !== pwd_conf) {
        document.getElementById("pwd-error").className += "visible";
        return;
    }
    var ec = new elliptic.ec('secp256k1');
    var keypair = ec.genKeyPair();

    // Create the first block of the blockchain : the Birthday Block
    let birthblock = makeBirthBlock(birthdate, keypair.getPublic(true, 'hex'));
    birthblock = await signblock(birthblock, keypair);
    cypherAndSavePrivateKey(keypair, pwd);
    await updateMyBlockchain([birthblock]);
    updatePage();
    $("#newAccountModal").modal("hide");
}

function saveBlockchain(bc) {
    const cleanBc = [];
    for (let i=0; i<bc.length; i++) {
        cleanBc[i] = bc[i];
    }
    const binBc = msgpack.encode(cleanBc);
    return localforage.setItem('guzi-blockchain', binBc).then(() => {
        console.log(`Blockchain successfully saved`);
    }).catch(function(err) {
        console.error(`Error while saving Blockchain`);
        console.error(err);
    });
}

/**
 * Return the blockchain locally saved
 * completed with some usefull methods
 */
async function loadBlockchain() {
    let blockchain = await localforage.getItem('guzi-blockchain');
    if (blockchain !== null) {
        blockchain = msgpack.decode(blockchain);
    }
    return basicBlockchainToObject(blockchain);
}

function basicBlockchainToObject(basicBC) {
    return $.extend(basicBC, {
        getLevel : function() { 
            if (! this.isCreated() && ! this.isValidated()) { return 0; }
            return Math.floor(Math.cbrt(this[0].t)) + 1;
        },

        getGuzisBeforeNextLevel: function() {
            if (! this.isCreated() && ! this.isValidated()) { return 0; }
            const level = this.getLevel();
            return Math.pow(level, 3) - this[0].t;
        },

        getGuzis: function() {
            if (this.isEmpty() || this.isCreated() || this.isWaitingValidation()) {
                return 0;
            }
            return this[0].g;
        },

        isEmpty: function() {
            return this.length === undefined;
        },

        isCreated: function() {
            return !this.isEmpty() && this.length === 0;
        },

        isWaitingValidation: function() {
            return !this.isEmpty() && this.length === 1
                && this[0].ph === REF_HASH;
        },

        isValidated: function() {
            return !this.isEmpty() && this.length >= 2
                && this[this.length-1].ph === REF_HASH;
        },

        createDailyGuzis: async function(key) {
            if (this.hasCreatedGuzisToday()) {
                showModalError("Guzis déjà créés aujourd'hui");
                return null;
            }
            let tx = {
                v: CUR_VERSION,
                t: 0,
                d: new Date().toISOString().slice(0, 10),
                s: this[this.length-1].s,
                a: 1
            };
            tx = await signtx(tx, key);
            this.addTx(tx);
            console.log(this);
            return this;
        },

        addTx: function(tx) {
            console.log("addTx");
            if (this[0].s !== undefined) {
                this.newBlock();
            }
            this[0].g += tx.a;
            this[0].tx.push(tx);
        },

        newBlock: function() {
            console.log("newBlock");
            this.unshift({
                v: CUR_VERSION,
                ph: this[0].ph,
                g: this[0].g,
                b: this[0].b,
                t: this[0].t,
                tx: []
            });
        },

        hasCreatedGuzisToday: function() {
            for (let i=0; i<this.length; i++) {
                if (this[i].d !== undefined && new Date(this[i].d) < new Date()) {
                    return false;
                }
                if (this[i].tx !== undefined) {
                    for (let t=0; t<this[i].tx.length; t++) {
                        if (this[i].tx[t].d === new Date().toISOString().slice(0, 10) && this[i].tx[t].t === 0) {
                            return true;
                        }
                    }
                }
            }
            return null;
        }
    });
}

function cypherAndSavePrivateKey(keypair, pwd) {
    const cipherkey = CryptoJS.AES.encrypt(JSON.stringify(keypair), pwd).toString();

    localforage.setItem('guzi-cipherkey', [cipherkey]).then(() => {
        console.log(`Private key successfully saved`);
    }).catch(function(err) {
        console.err(`Error while saving Private key`);
    });
}

function askPwdAndLoadPrivateKey(callback) {
    $("#pwdValidation").on("click", async () => {
        const pwd = $("#pwdPrompt").val();
        const cipherkey  = await localforage.getItem('guzi-cipherkey');
        const bytes  = CryptoJS.AES.decrypt(cipherkey[0], pwd);
        if (bytes.sigBytes === 0) {
            showModalError("Mot de passe incorect.");
            return;
        }
        let keypair = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        const ec = new elliptic.ec('secp256k1');
        keypair = ec.keyFromPrivate(keypair.priv);
        $("#pwdModal").modal("hide");
        callback(keypair);
    });
    $("#pwdModal").modal("show");
}

function toHexString(byteArray) {
    return Array.from(byteArray, function(byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
}

function exportBlockchain(bc) {
    return toHexString(msgpack.encode(bc));
}

function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

function hexToJson(hex) {
    const bytes = hexToBytes(hex);
    return msgpack.decode(bytes);
}

async function sendBlockchain(type, bc=-1) {
    if (bc === -1) {
        bc = await loadBlockchain();
    }

    if (bc === null) {
        showModalError("Aucune chaine de blocks détectée");
    } else {
        // console.log(bc);
        const msg = {
            t: type,
            bc: bc
        }
        const hexMsg = exportBlockchain(msg);
        window.open(`mailto:test@example.com?subject=Demande de référent&body=${hexMsg}`);
    }
            
}

function makeBirthBlock(birthdate, publicHexKey) {
    return {
        v: CUR_VERSION, // Version
        d: birthdate, // User birth date
        ph: REF_HASH, // Previous hash : here "random"
        s: publicHexKey, // Compressed Signer public key, here the new one created
        g: 0, b: 0, t: 0, // 0 guzis, 0 boxes, 0 total
    }
}

function hashblock(block) {
    const b = {
        v: block.v,
        d: block.d,
        ph: block.ph,
        s: block.s,
        g: block.g,
        b: block.b,
        t: block.t,
    };
    const packedblock = msgpack.encode(b);
    const shaObj = new jsSHA("SHA-256", "UINT8ARRAY", { encoding: "UTF8" });
    shaObj.update(packedblock);
    return shaObj.getHash("HEX");
}

function hashtx(tx) {
    const t = {
        v: tx.v,
        t: tx.t,
        d: tx.d,
        s: tx.s,
        a: tx.a
    }
    const packedtx = msgpack.encode(t);
    const shaObj = new jsSHA("SHA-256", "UINT8ARRAY", { encoding: "UTF8" });
    shaObj.update(packedtx);
    return shaObj.getHash("HEX");
}

async function signblock(block, key) {
    const hash = hashblock(block);
    block.h = key.sign(hash).toDER('hex');
    return block;
}

async function signtx(tx, key) {
    const hash = hashtx(tx);
    tx.h = key.sign(hash).toDER('hex');
    return tx;
}

function updateContacts() {
    localforage.getItem('guzi-contacts').then(contacts => {
        let html = "";
        if (contacts === null) { return }
        contacts.sort().forEach((contact) => {
            html += `<tr>
            <td>${contact.name}</td>
            <td>${contact.email}</td>
            <td class="text-truncate">${contact.key.substring(0, 10)}...</td>
                </tr>`;
        });
        document.getElementById("contact-list").innerHTML = html;
    }).catch(function(err) {
        // This code runs if there were any errors
        console.log(err);
    });
}

async function updatePage() {
    $(".basically-hidden").hide();
    blockchain = await loadBlockchain();
    if (blockchain.isEmpty()) {
        $("#guziInformationsButton").show();
        $("#newAccountButton").show();
        $("#guzi-account-info").html("Vous êtes actuellement niveau 0. Vous devez créer un compte pour passer niveau 1.");
    } else if (blockchain.isWaitingValidation()) {
        $("#guziInformationsButton").show();
        $("#sendAccountButton").show();
        $("#importValidatedAccountButton").show();
        $("#guzi-account-info").html("Vous devez faire valider votre compte pour passer niveau 1.");
        $("#accountStatusSection .progress-bar").attr("aria-valuenow", "50");
        $("#accountStatusSection .progress-bar").attr("style", "width: 50%");
        $("#accountStatusSection .progress-bar").html("Compte à valider");
    } else if (blockchain.isValidated()) {
        $("#guziSection").show();
        $("#contactSection").show();
        const level = blockchain.getLevel();
        $("#guzi-account-info").html(`Niveau ${level}. ${blockchain.getGuzisBeforeNextLevel()} Guzis pour atteindre le niveau ${level+1}.`);
        $("#guziAvailableAmount").html(`Guzis disponibles : ${blockchain.getGuzis()}/${level*30}`);

        const percent = Math.floor(blockchain.getGuzis()/(level*30)*100);
        $("#guziSection .progress-bar").attr("aria-valuenow", `${percent}`);
        $("#guziSection .progress-bar").attr("style", `width: ${percent}%`);
        $("#guziSection .progress-bar").html("");

        $("#accountStatusSection .progress-bar").attr("aria-valuenow", "0");
        $("#accountStatusSection .progress-bar").attr("style", "width: 0%");
        $("#accountStatusSection .progress-bar").html("");
    }
}

function addContactFromModal() {
    addContact(
        document.getElementById("new-contact-modal-name").value,
        document.getElementById("new-contact-modal-email").value,
        document.getElementById("new-contact-modal-key").value
    );
}

function addContact(name, email, key) {
    return localforage.getItem('guzi-contacts').then(contacts => {
        if (contacts === null) { contacts = [] }
        contacts.push({"name": name, "email": email, "key": key});
        localforage.setItem('guzi-contacts', contacts).then(() => {
            console.log(`${name} successfully saved`);
            updateContacts();
        }).catch(function(err) {
            console.err(`Error while saving ${name}`);
        });
    });
}

async function importData(data, modal) {
    jsondata = hexToJson(data);
    console.log(jsondata);
    if (! isValidBC(jsondata)) {
        console.error(jsondata);
        showModalError("Les informations données sont invalides.");
        return false;
    }
    if (jsondata.t === MSG.VALIDATION_DEMAND) {
        // console.log("It's an initialization");
        if (modal) {
            modal.modal("hide");
        }
        showModalAccountValidation(jsondata.bc[0]);
        return true;
    } else if (jsondata.t === MSG.VALIDATION_ACCEPT) {
        // console.log("It's a validated account");
        if (modal) { modal.modal("hide"); }
        try {
            const blockchain = jsondata.bc;
            await updateMyBlockchain(blockchain);
            updatePage();
        } catch (error) {
            showModalError("La blockchain donnée n'est pas valide");
            console.log(error);
            return false;
        }
        return true;
    } else if (jsondata.t === MSG.PAYMENT) {
        // console.log("It's a payment");
        return true;
    }
}

/**
 * Return true if given blockchain is valid, false else.
 */
function isValidBC(blockchain) {
    return blockchain.t !== undefined;
}

function isValidInitializationBlock(block) {
    const ec = new elliptic.ec('secp256k1');
    const key = ec.keyFromPublic(block.s, 'hex');
    // console.log(key);
    return block.ph === REF_HASH
        && block.v === 1
        && block.g === 0
        && block.b === 0
        && block.t === 0
        && key.verify(hashblock(block), block.h);
}

async function updateMyBlockchain(blockchain) {
    const oldBC = await loadBlockchain();
    const newBC = updateBlockchain(oldBC, blockchain);
    return saveBlockchain(newBC);
}

function updateBlockchain(oldBC, newBC) {
    if (! toHexString(newBC).endsWith(toHexString(oldBC))) {
        throw "Invalid new Blockchain";
    }
    return newBC;
}

function setBindings() {
    $("#import-data-pasted").bind('paste', function(e) {
        importData(e.originalEvent.clipboardData.getData('text'), $("#importModal"));
    });
    $("#sendAccountButton").on("click", () => {
        sendBlockchain(MSG.VALIDATION_DEMAND);
    });
    $("#importValidatedAccountButton").on("click", showModalImport);
    $("#importPaymentButton").on("click", showModalImport);
    $("#createMyGuzisButton").on("click", createDailyGuzis);
    $("#newContactValidationButton").on("click", addContactFromModal);
    $("#newAccountValidationButton").on("click", createAccountFromModal);
}

function showModalImport() {
    $("#import-data-pasted").val("");
    $("#importModal").modal("show");
}

function showModalError(msg) {
    $("#modal-error-content").html(msg);
    $("#errorModal").modal("show");
}

function showModalAccountValidation(block) {

    let html = `
    <tr> <td>Version</td> <td>${block.v}</td></tr>
    <tr> <td>Birthdate</td> <td>${block.d}</td></tr>
    <tr> <td>Guzis</td> <td>${block.g}</td></tr>
    <tr> <td>Boxes</td> <td>${block.b}</td></tr>
    <tr> <td>Total</td> <td>${block.t}</td></tr>
    <tr> <td>Signataire</td> <td>${block.s.slice(0,8)}...</td></tr>
    <tr> <td>Hash de base</td> <td>${block.ph.slice(0,8)}...</td></tr>
    <tr> <td>Hash</td> <td>${block.h.slice(0,8)}...</td></tr>`;
    $("#account-validation-detail").html(html);

    if (isValidInitializationBlock(block)) {
        $("#account-validation-state").html(`
            <div class="alert alert-success" role="alert">
            Le block semble valide
            </div>
        `);
        $("#accountValidationButton").show();
        $("#accountValidationButton").on("click", () => {
            $("#accountValidationModal").modal("hide");
            askPwdAndLoadPrivateKey(async (keypair) => {
                const bc = await validateAccount(block, keypair);
                sendBlockchain(MSG.VALIDATION_ACCEPT, bc);
                $("#accountValidationModal").modal("hide");
            });
        });

    } else {
        $("#account-validation-state").html(`
            <div class="alert alert-warning" role="alert">
            Attention : le block n'est pas valide !
            </div>
        `);
        $("#accountValidationButton").hide();
    }

    $("#accountValidationModal").modal("show");
}

async function validateAccount(birthblock, key) {

    let initializationBlock = {
            b: 0,
            d: new Date().toISOString().slice(0, 10),
            g: 0,
            ph: birthblock.h,
            s: key.getPublic(true, 'hex'),
            t: 0,
            v: CUR_VERSION
    }
    initializationBlock = await signblock(initializationBlock, key);
    return [initializationBlock, birthblock];
}

function createDailyGuzis() {
    askPwdAndLoadPrivateKey(async (keypair) => {
        let bc = await loadBlockchain();
        bc = await bc.createDailyGuzis(keypair);
        if (bc === null) {
            return;
        }
        await updateMyBlockchain(bc);
        updatePage();
    });
}
