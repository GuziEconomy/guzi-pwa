// TODO :
// + Test back from step 0
// + Create my Guzis
// + Payment then
async function createAccountFromModal() {
    const birthdate = document.getElementById("new-account-modal-birthdate").value;
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
    saveBlockchain([birthblock]).then(() => {
        updatePage();
        $("#newAccountModal").modal("hide")
    });
}

function saveBlockchain(bc) {
    return localforage.setItem('guzi-blockchain', bc).then(() => {
        console.log(`Blockchain successfully saved`);
    }).catch(function(err) {
        console.error(`Error while saving Blockchain`);
        console.error(err);
    });
}

/**
 * Return the blockchain locally saved
 */
async function loadBlockchain() {
    const blockchain = await localforage.getItem('guzi-blockchain');
    return $.extend(blockchain, {
        getLevel : function() { 
            return Math.floor(Math.cbrt(this[0].t)) + 1;
        },

        getGuzisBeforeNextLevel: function() {
            const level = this.getLevel();
            return Math.pow(level, 3) - this[0].t;
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

// TODO : find a way to handle wrong password
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

async function sendBlockchain(bc=-1) {
    if (bc === -1) {
        bc = await loadBlockchain();
    }

    if (bc === null) {
        showModalError("Aucune chaine de blocks détectée");
    } else {
        console.log(bc);
        const hexBc = exportBlockchain(bc);
        window.open(`mailto:test@example.com?subject=Demande de référent&body=${hexBc}`);
    }
            
}

function makeBirthBlock(birthdate, publicHexKey) {
    return {
        v: 1, // Version
        d: birthdate, // User birth date
        ph: "c1a551ca1c0deea5efea51b1e1dea112ed1dea0a5150f5e11ab1e50c1a15eed5", // Previous hash : here "random"
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

async function signblock(block, key) {
    const hash = hashblock(block);
    block.h = key.sign(hash).toDER('hex');
    return block;
}

// TODO : use messagepack and create hashes
function makeTx(type, target, amount) {
    let tx = {v: 1, t: type, d: Date.now(), t: target, a: amount, h: null};
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
    blockchain = await loadBlockchain();
    if (blockchain === null) {
        $("#guziInformationsButton").show();
        $("#newAccountButton").show();
        $("#sendAccountButton").hide();
        $("#createMyGuzisButton").prop("disabled", true);
        $("#importValidatedAccountButton").hide();
        $("#importPaymentButton").prop("disabled", true);
        $("#guzi-account-info").html("Vous êtes actuellement niveau 0. Vous devez créer un compte pour passer niveau 1.");
    } else if (blockchain.length === 1) {
        $("#guziInformationsButton").show();
        $("#newAccountButton").hide();
        $("#sendAccountButton").show();
        $("#createMyGuzisButton").prop("disabled", true);
        $("#importValidatedAccountButton").show();
        $("#importPaymentButton").prop("disabled", true);
        $("#guzi-account-info").html("Vous êtes actuellement niveau 0,5. Vous devez faire valider votre compte pour passer niveau 1.");
    } else {
        // Not new user : hide account creation
        $("#guziInformationsButton").hide();
        $("#newAccountButton").hide();
        $("#sendAccountButton").hide();
        $("#createMyGuzisButton").prop("disabled", false);
        $("#importValidatedAccountButton").hide();
        $("#importPaymentButton").prop("disabled", false);
        const level = blockchain.getLevel();
        const guzisBeforeNextLevel = blockchain.getGuzisBeforeNextLevel();
        $("#guzi-account-info").html(`Niveau ${level}. ${guzisBeforeNextLevel} Guzis pour atteindre le niveau ${level+1}.`);
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
    // TODO
    // - Detect if it's a block
    // - Detect if it's a blockchain
    // - if it's a payment
    data = data.replace(/\s/g, '');
    jsondata = hexToJson(data);
    console.log(jsondata);
    if (! isValidBC(jsondata)) {
        showModalError("Les informations données sont invalides.");
        return false;
    }
    if (jsondata.length === 1) {
        console.log("It's an initialization");
        if (modal) {
            modal.modal("hide");
        }
        showModalAccountValidation(jsondata[0]);
        return true;
    } else if (jsondata.length === 2) {
        console.log("It's a validated account");
        if (modal) {
            modal.modal("hide");
        }
        try {
            const blockchain = hexToJson(data);
            await updateMyBlockchain(blockchain);
            updatePage();

        } catch (error) {
            showModalError("La blockchain donnée n'est pas valide");
            console.log(error);
            return false;
        }
        return true;
    } else if (jsondata.length > 1) {
        console.log("It's a payment");
        return true;
    }
}

/**
 * Return true if given blockchain is valid, false else.
 */
function isValidBC(blockchain) {
    if (! Array.isArray(blockchain)) {
        return false;
    }
    if (blockchain.length === 0) {
        return false;
    }
    return true;
}

function isValidInitializationBlock(block) {
    const ec = new elliptic.ec('secp256k1');
    const key = ec.keyFromPublic(block.s, 'hex');
    console.log(key);
    return block.ph === "c1a551ca1c0deea5efea51b1e1dea112ed1dea0a5150f5e11ab1e50c1a15eed5"
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
    console.log("binding done");
    $("#import-data-pasted").bind('paste', function(e) {
        importData(e.originalEvent.clipboardData.getData('text'), $("#importModal"));
    });
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
    <tr> <td>Signataire</td> <td>${block.s}</td></tr>
    <tr> <td>Hash de base</td> <td>${block.ph}</td></tr>
    <tr> <td>Hash</td> <td>${block.h}</td></tr>`;
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
                sendBlockchain(bc);
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
            d: new Date().toLocaleString().slice(0, 10),
            g: 0,
            ph: birthblock.h,
            s: key.getPublic(true, 'hex'),
            t: 0,
            v: 1
    }
    initializationBlock = await signblock(initializationBlock, key);
    return [initializationBlock, birthblock];
}
