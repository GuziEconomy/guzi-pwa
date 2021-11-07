import Blockchain from 'guzi-money'
import localforage from 'localforage'
import { enc, AES } from 'crypto-js'
import VanillaToasts from 'vanillatoasts'

document.addEventListener("DOMContentLoaded", () => {
  setBindings()
  updateContacts()
  updatePage()
})

async function createAccountFromModal() {
  const name = $('#new-account-modal-name').val()
  let birthdate = $('#new-account-modal-birthdate').val()
  // DD/MM/YYYY to YYYY-MM-DD
  birthdate = birthdate.slice(6,10) + '-' + birthdate.slice(3,5) + '-' + birthdate.slice(0,2)
  const pwd = $('#new-account-modal-password').val()
  const pwd_conf = $('#new-account-modal-password-confirmation').val()
  if (pwd !== pwd_conf) {
    $('#pwd-error').addClass("visible")
    return
  }
  const privateKey = Blockchain.randomPrivateKey()

  // Create the first block of the blockchain : the Birthday Block
  const birthblock = Blockchain.makeBirthBlock(birthdate, privateKey)
  await cypherAndSavePrivateKey(privateKey, pwd)
  await saveBlockchain(new Blockchain([birthblock]))
  await addContact(name, '-', Blockchain.publicFromPrivate(privateKey), 0)
  updatePage()
  updateContacts()
  $('#newAccountModal').modal('hide')
}

function saveBlockchain(bc) {
  return localforage.setItem('guzi-blockchain', bc.asBinary()).then(() => {
    alert('Enregistrement', 'Chaine de block sauvegardée avec succès.', 'success')
  }).catch(err => {
    alert('Erreur', 'Une erreur est survenue, la chaine de blocks n\'a pas pu être sauvegardée', 'error')
    console.error(err)
  })
}

function alert(title, text, type='info') {
  VanillaToasts.create({
    title: title,
    text: text,
    type: type, // success, info, warning, error   / optional parameter
    // icon: '/img/alert-icon.jpg', // optional parameter
    timeout: 5000, // hide after 5000ms, // optional parameter
    // callback: function() { ... } // executed when toast is clicked / optional parameter
  });
}

/**
 * Return the blockchain locally saved
 * completed with some usefull methods
 */
async function loadBlockchain() {
  let blocks = await localforage.getItem('guzi-blockchain')
  return new Blockchain(blocks)
}

async function loadContacts() {
  return await localforage.getItem('guzi-contacts')
}

async function loadMe() {
  const contacts = await loadContacts()
  if (contacts === null) {
    return {name:"", key:"", email:""}
  }
  return contacts.find(c => c.id === 0)
}

async function cypherAndSavePrivateKey(privateKey, pwd) {
  const cipherkey = await Blockchain.aesEncrypt(privateKey, pwd)

  try {
    localforage.setItem('guzi-cipherkey', cipherkey)
  } catch (error) {
    alert('Erreur', 'La clé privée n\'a pas pu être sauvegardée.', 'error')
    console.error(error)
    return
  } 
  alert('Enregistrement', 'Clé privée sauvegardée avec succès.', 'success')
}

function askPwdAndLoadPrivateKey(callback) {
  $("#pwdValidation").on("click", async () => {
    const pwd = $("#pwdPrompt").val()
    const encrypted  = await localforage.getItem('guzi-cipherkey')
    let privateKey
    try {
      privateKey  = await Blockchain.aesDecrypt(encrypted, pwd)
    } catch (error) {
      $("#pwdModal").modal("hide")
      $("#pwdValidation").unbind("click")
      alert('Erreur', 'Mot de passe invalide', 'error')
      return
    }
    $("#pwdModal").modal("hide")
    $("#pwdValidation").unbind("click")
    callback(privateKey)
  })
  $("#pwdModal").modal("show")
}

async function sendBlockchain(target, type, bc=-1) {
  if (bc === -1) {
    bc = await loadBlockchain()
  }

  if (bc === null) {
    alert('Erreur', 'Aucune chaine de blocks détectée', 'error')
  } else {
    const msg = {
      t: type,
      bc: bc.asB64()
    }
    showExportModal(JSON.stringify(msg),target)
  }
}

async function updateContacts() {
  const contacts = await loadContacts()
  let html = ""
  if (contacts === null) { return }
  const me = contacts.find(c => c.id === 0)
  html += `
            <tr>
                <td>${me.name} (moi)</td>
                <td>${me.email}</td>
                <td></td>
            </tr>`
  contacts.filter(c=>c.id>0).sort((a,b)=>a.name>b.name).forEach((contact) => {
    html += `
            <tr>
                <td>${contact.name}</td>
                <td>${contact.email}</td>
                <td></td>
            </tr>`
  })
  document.getElementById("contact-list").innerHTML = html
}

async function updatePage(blockchain=null) {
  $(".basically-hidden").hide()
  if (blockchain === null) {
    blockchain = await loadBlockchain()
  }
  const me = await loadMe()
  $("#navbarUserName").html(me.name)
  if (blockchain.isEmpty()) {
    $("#landing-first-visit").show()
  } else if (blockchain.isWaitingValidation()) {
    $("#landing-created-account").show()
  } else if (blockchain.isValidated()) {
    $("#landing-validated-account").show()
    const level = blockchain.getLevel()

    $("#guziAvailableAmount").html(`Guzis : ${blockchain.getAvailableGuziAmount()}/${level*30}`)

    $("#levelProgressBar").html(`Niveau ${level} (${blockchain.getGuzisBeforeNextLevel()} guzis avant niveau ${level+1})`)
    const percent = Math.floor(blockchain.getGuzisBeforeNextLevel(true))
    $("#levelProgressBar").attr("aria-valuenow", `${percent}`)
    $("#levelProgressBar").attr("style", `width: ${percent}%`)
  }
}

function addContactFromModal() {
  addContact(
    document.getElementById("new-contact-modal-name").value,
    document.getElementById("new-contact-modal-email").value,
    document.getElementById("new-contact-modal-key").value
  )
}

async function addContact(name, email, key, index=-1) {
  contacts = await loadContacts()
  if (contacts === null) {
    contacts = []
  } else if (index === -1) {
    index = contacts[contacts.length-1].id + 1
  }
  contacts.push({"id": index, "name": name, "email": email, "key": key})
  localforage.setItem('guzi-contacts', contacts).then(() => {
    alert('Enregistrement', `${name} enregistré avec succès.`, 'success')
    updateContacts()
  }).catch(function(err) {
    alert('Erreur', `${name} n'a pas pu être enregistré. Veuillé réessayer.`, 'error')
  })
}

async function importData(data, modal) {
  const jsondata = JSON.parse(data)
  if (jsondata === undefined) {
    alert('Erreur', 'Les informations données sont invalides.', 'error')
    return
  }
  const blockchain = new Blockchain(jsondata.bc)
  if (jsondata.t === Blockchain.MSG.VALIDATION_DEMAND) {
    if (modal) { modal.modal("hide") }
    showModalAccountValidation(blockchain)
  } else if (jsondata.t === Blockchain.MSG.VALIDATION_ACCEPT) {
    if (modal) { modal.modal("hide") }
    try {
      saveBlockchain(blockchain)
      updatePage(blockchain)
    } catch (error) {
      alert('Erreur', 'La blockchain donnée n\'est pas valide', 'error')
      console.error(error)
    }
  } else if (jsondata.t === Blockchain.MSG.PAYMENT) {
    if (! blockchain.isValid()) {
      alert('Erreur', 'La chaine de block reçue est invalide', 'error')
      console.error(jsondata.bc)
      return
    }
    const mybc = await loadBlockchain()
    mybc.addTx(blockchain.getLastTx())
    await saveBlockchain(mybc)
    if (mybc.hasLevelUpOnLastTx()) {
      showCongratulationModal(mybc.getLevel())
    }
    updatePage(mybc)
  }
}

function setBindings() {
  $("#import-data-pasted").bind('paste', function(e) {
    importData(e.originalEvent.clipboardData.getData('text'), $("#importModal"))
  })
  $("#sendAccountButton").on("click", () => {
    sendBlockchain("test@example.com", Blockchain.MSG.VALIDATION_DEMAND)
  })
  $("#importValidatedAccountButton").on("click", showModalImport)
  $("#importPaymentButton").on("click", showModalImport)
  $("#createMyGuzisButton").on("click", createDailyGuzis)
  $("#newContactValidationButton").on("click", addContactFromModal)
  $("#newAccountValidationButton").on("click", createAccountFromModal)
  $("#paymentButton").on("click", showPaymentModal)
  $("#be-referent-button").on("click", showModalImport)
  $("#historyButton").on("click", showHistoryModal)

  $(() => {
    $(".tab-panel").hide()
    $("#home").show()
  })

  $("#home-tab").on("click", () => {
    $(".navbar-toggler-icon").click()
    $(".tab-panel").hide()
    $("#home").show()
  })
  $("#contacts-tab").on("click", () => {
    $(".navbar-toggler-icon").click()
    $(".tab-panel").hide()
    $("#contacts").show()
  })
  $("#share-my-key-button").on("click", async () => {
    const me = await loadMe()
    showExportModal(me.key)
  })
  $('#pwdModal').on('shown.bs.modal', () => {
    $('#pwdPrompt').val('')
    $('#pwdPrompt').trigger('focus')
  })
  $('#errorModal').on('shown.bs.modal', () => {
    $('#errorModal button').trigger('focus')
  })
  $("#importModal").on('shown.bs.modal', () => {
    $('#import-data-pasted').trigger('focus')
  })
  $("form").submit((e) => {
    e.preventDefault()
  })
}

function showModalImport() {
  $("#import-data-pasted").val("")
  $("#importModal").modal("show")
}

function showModalAccountValidation(blockchain) {
  const block = blockchain.blocks[0]
  let html = `
    <tr> <td>Version</td> <td>${block.v}</td></tr>
    <tr> <td>Birthdate</td> <td>${block.d}</td></tr>
    <tr> <td>Guzis</td> <td>${JSON.stringify(block.g)}</td></tr>
    <tr> <td>Boxes</td> <td>${block.b}</td></tr>
    <tr> <td>Total</td> <td>${block.t}</td></tr>
    <tr> <td>Signataire</td> <td>${block.s.slice(0,8)}...</td></tr>
    <tr> <td>Hash de base</td> <td>${block.ph.slice(0,8)}...</td></tr>
    <tr> <td>Hash</td> <td>${block.h.slice(0,8)}...</td></tr>`
  $("#account-validation-detail").html(html)

  if (Blockchain.isValidInitializationBlock(block)) {
    $("#account-validation-state").html(`
            <div class="alert alert-success" role="alert">
            Le block semble valide
            </div>
        `)
    $("#accountValidationButton").show()
    $("#accountValidationButton").on("click", () => {
      $("#accountValidationModal").modal("hide")
      askPwdAndLoadPrivateKey((privateKey) => {
        const bc = Blockchain.validateAccount(block, privateKey)
        sendBlockchain("test@example.com", Blockchain.MSG.VALIDATION_ACCEPT, bc)
        $("#accountValidationButton").unbind("click")
        $("#accountValidationModal").modal("hide")
      })
    })

  } else {
    $("#account-validation-state").html(`
            <div class="alert alert-warning" role="alert">
            Attention : le block n'est pas valide !
            </div>
        `)
    $("#accountValidationButton").hide()
  }

  $("#accountValidationModal").modal("show")
}

function showExportModal(content, target) {
  $("#export-data-content").val(content)
  $("#exportModalCopyButton").on("click", () => {
    navigator.clipboard.writeText(content)
    $("#exportModal").modal("hide")
  })
  $("#exportModalEmailButton").on("click", () => {
    window.open(`mailto:${target}?subject=[Guzi]&body=${content}`)
    $("#exportModal").modal("hide")
  })
  $('#exportModal').on('hidden.bs.modal', () => {
    $("#exportModalCopyButton").unbind("click")
    $("#exportModalEmailButton").unbind("click")
  })
  $("#exportModal").modal("show")
}

async function showHistoryModal() {
  const contacts = await loadContacts()
  const bc = await loadBlockchain()
  let html = ""
  bc.getHistory().forEach(tx => {
    const source = contacts.find(c => JSON.stringify(c.key) === JSON.stringify(tx.s))
    const target = contacts.find(c => JSON.stringify(c.key) === JSON.stringify(tx.tu))
    let type = ""
    if (tx.t === Blockchain.TXTYPE.GUZI_CREATE) { type = "Création" }
    if (tx.t === Blockchain.TXTYPE.PAYMENT) { type = "Paiement" }
    html += `
      <tr>
          <td>${source ? source.name : (tx.s ? "??" : "-")}</td>
          <td>${target ? target.name : (tx.tu ? "??" : "-")}</td>
          <td>${tx.a}</td>
          <td>${type}</td>
          <td>${tx.d}</td>
      </tr>`
  })
  document.getElementById("history-list").innerHTML = html
  $("#historyModal").modal("show")
}

async function showPaymentModal() {
  let bc = await loadBlockchain()
  const contacts = await loadContacts()
  const me = contacts.find(c => c.id === 0)
  $("#pay-modal-target").html("")
  contacts.forEach(c => {
    $('#pay-modal-target').append(new Option(c.name, c.id))
  })
  $("#pay-modal-amount").attr("min", 0)
  $("#pay-modal-amount").attr("max", bc.getAvailableGuziAmount())
  $("#pay-modal-amount").val(bc.getAvailableGuziAmount())
  $("#pay-modal-amount-display").html(bc.getAvailableGuziAmount())
  $("#paymentValidationButton").on("click", () => {
    $("#paymentValidationButton").unbind("click")
    $("#paymentModal").modal("hide")
    // 1. Create TX. 2. Add it to BC. 3. Save BC.
    askPwdAndLoadPrivateKey(async (privateKey) => {
      const target = contacts.find(c => c.id == $("#pay-modal-target").val())
      bc.addTx(bc.createPaymentTx(privateKey, target.key, $("#pay-modal-amount").val()), contacts)
      await saveBlockchain(bc)
      updatePage(bc)
      if (bc.hasLevelUpOnLastTx()) {
        showCongratulationModal(bc.getLevel())
      }
      if (target && target.key !== me.key) {
        sendBlockchain(target.email, Blockchain.MSG.PAYMENT, bc)
      }
    })
  })
  $("#paymentModal").modal("show")
}

function showCongratulationModal (newLvl) {
  $('#congratulation-text').html(`Tu as atteint le niveau ${newLvl}. Tu créés maintenant ${newLvl} Guzis par jour !`)
  $('#congratulationModal').modal('show')
}

function createDailyGuzis() {
  askPwdAndLoadPrivateKey(async (keypair) => {
    const bc = await loadBlockchain()
    try {
      const tx = bc.createDailyGuzisTx(keypair)
      bc.addTx(tx)
      saveBlockchain(bc)
      updatePage(bc)
    } catch (e) {
      alert('Erreur', 'Guzis déjà créés aujourd\'hui', 'error')
    }
  })
}
