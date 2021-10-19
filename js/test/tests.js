const ec = new elliptic.ec('secp256k1');
// ({ "priv":"ed945716dddb7af2c9774939e9946f1fee31f5ec0a3c6ec96059f119c396912f",
// "pub":[
//     "c85e4e448d67a8dc724c620f3fe7d2a3a3cce9fe905b918f712396b4f8effcb3",
//     "ab1b8f3ba4816171fa61c3940f157d3136a786f03411cd5e19e0ba43d9104d60"
// ]});

const keypair = ec.keyFromPrivate("ed945716dddb7af2c9774939e9946f1fee31f5ec0a3c6ec96059f119c396912f", "hex");

// ({ "priv":"e68955130b2c4adc6165b0bae6e6b8f4bcce1879dbf0c6f91b3acc69479ef272",
// "pub": "03cbe4edbfbbc99dfbae83e8c591fafdd6a82d61589be6f60775e3fe2a4677ef46")
const keypair2 = ec.keyFromPrivate("e68955130b2c4adc6165b0bae6e6b8f4bcce1879dbf0c6f91b3acc69479ef272", "hex");

const validBirthBlock = () => {
    return {
        b: 0,
        d: "28/11/1989",
        g: {},
        h: "3046022100a79541ba6261790d13bfaf2d4177a0a645a3baade652bbc31daf0e2b6801300c022100de8f9ad1842e5634dd8027c1e4c90026303f201a00322df4a76e6330943702bb",
        ph: REF_HASH,
        s: "02c85e4e448d67a8dc724c620f3fe7d2a3a3cce9fe905b918f712396b4f8effcb3",
        t: 0,
        v: 1
    }
}

const validInitBlock = () => {
    return {
        b: 0,
        d: "21/09/2021",
        g: {},
        h: "304502202422e7ba167cbe7289051886fd7e9a6957676cde7abba34e3f4ccfa1c7d76437022100bd824547e46638a6d70cbbbaf1f276d639bbb4354ca2461cef1c74db34542c12",
        ph: "3046022100a79541ba6261790d13bfaf2d4177a0a645a3baade652bbc31daf0e2b6801300c022100de8f9ad1842e5634dd8027c1e4c90026303f201a00322df4a76e6330943702bb",
        s: "02c85e4e448d67a8dc724c620f3fe7d2a3a3cce9fe905b918f712396b4f8effcb3",
        t: 0,
        v: 1
    }
}

const validBlockchain = () => {
    return [validInitBlock(), validBirthBlock()];
}

QUnit.module('callLibraries', () => {
    QUnit.test('AES crypt//decrypt', (assert) => {
        const crypted = CryptoJS.AES.encrypt("test", "toto").toString();
        const bytes  = CryptoJS.AES.decrypt(crypted, "toto");
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        assert.equal(decrypted, "test");
    })

    QUnit.test('elliptic', (assert) => {
        const ec = new elliptic.ec('secp256k1');

        assert.ok(ec);
    })

    QUnit.test('localforage', (assert) => {
        assert.ok(localforage);
    })
})

QUnit.module('makeBirthBlock', () => {
    QUnit.test('Should return corectly filled block', (assert) => {
        const birthdate = "12/12/2002";
        const publicHexKey = "000000000000000000000000000000000000000000000000000000000000000000";

        const block = makeBirthBlock(birthdate, publicHexKey);

        const expected = {
            v: 1,
            d: birthdate,
            ph: REF_HASH,
            s: publicHexKey,
            g: {}, b: 0, t: 0,
        }

        assert.deepEqual(block, expected);
    })
})


QUnit.module('hashblock', () => {
    QUnit.test('Should make valid hash', async (assert) => {
        const block = {
            v: 1,
            d: "28/11/1989",
            ph: REF_HASH,
            s: "02c85e4e448d67a8dc724c620f3fe7d2a3a3cce9fe905b918f712396b4f8effcb3",
            g: {}, b: 0, t: 0,
        };

        const expected = "ff44d337f401ae1d4398e55f468809f7b14de2995f7d6b20aef2316a576ec19c";

        result = hashblock(block);

        assert.equal(result, expected);
    })

    QUnit.test('Should ignore existing hash', async (assert) => {
        const block = {
            v: 1,
            d: "28/11/1989",
            ph: REF_HASH,
            s: "02c85e4e448d67a8dc724c620f3fe7d2a3a3cce9fe905b918f712396b4f8effcb3",
            g: {}, b: 0, t: 0,
            h: 12
        };

        const expected = "ff44d337f401ae1d4398e55f468809f7b14de2995f7d6b20aef2316a576ec19c";

        result = hashblock(block);

        assert.equal(result, expected);
    })
})

QUnit.module('hashtx', () => {
    QUnit.test('Should make valid hash', async (assert) => {
        const tx = {
            v: 1,
            t: 0,
            d: "2010-12-21",
            s: "02e31267fc0e24e6a3da9e40fedb23f98c750bddb3278a1873ab49c601f3bbd66b",
            a: 1
        };

        const expected = "c5a203d4341ed5e55457208b325db896a8d258811491a2e98b2544852b43dc14";

        result = hashtx(tx);

        assert.equal(result, expected);
    })

    QUnit.test('Should ignore existing hash', async (assert) => {
        const tx = {
            v: 1,
            t: 0,
            d: "2010-12-21",
            s: "02e31267fc0e24e6a3da9e40fedb23f98c750bddb3278a1873ab49c601f3bbd66b",
            a: 1,
            h: 12
        };

        const expected = "c5a203d4341ed5e55457208b325db896a8d258811491a2e98b2544852b43dc14";

        result = hashtx(tx);

        assert.equal(result, expected);
    })
})

QUnit.module('signblock', () => {
    QUnit.test('Should make valid signature', async (assert) => {
        const block = {
            v: 1,
            d: "28/11/1989",
            ph: REF_HASH,
            s: "02c85e4e448d67a8dc724c620f3fe7d2a3a3cce9fe905b918f712396b4f8effcb3",
            g: 0, b: 0, t: 0,
        };

        const expected = {
            v: 1,
            d: "28/11/1989",
            ph: REF_HASH,
            s: "02c85e4e448d67a8dc724c620f3fe7d2a3a3cce9fe905b918f712396b4f8effcb3",
            g: 0, b: 0, t: 0,
            // h: "cd46dbbf4deef70d7519f3e5dc825311bd0935c958571f87e399a860d1aac5cd",
            h: "3045022100fa8fa6d39457649ba21cca129ec6c3b41bb2dbb4247dd47a5491cb3567fad5d30220434ef707b7a044e05646a564445a279e4ffab7b00a9649e8a2d7fce165c3a8ad"
        }

        const signedBlock = await signblock(block, keypair);

        assert.deepEqual(block, expected);
    })
})

QUnit.module('exportToHex', () => {
    QUnit.test('Should return the encoded block', (assert) => {
        const block = {
            v: 1,
            d: "28/11/1989",
            ph: REF_HASH,
            s: "02c85e4e448d67a8dc724c620f3fe7d2a3a3cce9fe905b918f712396b4f8effcb3",
            g: 0, b: 0, t: 0,
            h: "3045022100fa8fa6d39457649ba21cca129ec6c3b41bb2dbb4247dd47a5491cb3567fad5d30220434ef707b7a044e05646a564445a279e4ffab7b00a9649e8a2d7fce165c3a8ad"
        };

        const expected = "88a17601a164aa32382f31312f31393839a27068d94063316135353163613163306465656135656665613531623165316465613131326564316465613061353135306635653131616231653530633161313565656435a173d942303263383565346534343864363761386463373234633632306633666537643261336133636365396665393035623931386637313233393662346638656666636233a16700a16200a17400a168d98e33303435303232313030666138666136643339343537363439626132316363613132396563366333623431626232646262343234376464343761353439316362333536376661643564333032323034333465663730376237613034346530353634366135363434343561323739653466666162376230306139363439653861326437666365313635633361386164";

        const result = exportBlockchain(block);

        assert.equal(result, expected);
    })

    QUnit.test('Should return the encoded blockchain', (assert) => {
        const bc = [{
            v: 1,
            d: "28/11/1989",
            ph: REF_HASH,
            s: "02c85e4e448d67a8dc724c620f3fe7d2a3a3cce9fe905b918f712396b4f8effcb3",
            g: 0, b: 0, t: 0,
            h: "3045022100fa8fa6d39457649ba21cca129ec6c3b41bb2dbb4247dd47a5491cb3567fad5d30220434ef707b7a044e05646a564445a279e4ffab7b00a9649e8a2d7fce165c3a8ad"
        }];

        const expected = "9188a17601a164aa32382f31312f31393839a27068d94063316135353163613163306465656135656665613531623165316465613131326564316465613061353135306635653131616231653530633161313565656435a173d942303263383565346534343864363761386463373234633632306633666537643261336133636365396665393035623931386637313233393662346638656666636233a16700a16200a17400a168d98e33303435303232313030666138666136643339343537363439626132316363613132396563366333623431626232646262343234376464343761353439316362333536376661643564333032323034333465663730376237613034346530353634366135363434343561323739653466666162376230306139363439653861326437666365313635633361386164";

        const result = exportBlockchain(bc);

        assert.equal(result, expected);
    })
})

QUnit.module('isValidInitializationBlock', () => {
    QUnit.test('Should return true for valid block', (assert) => {
        const result = isValidInitializationBlock(validBirthBlock());

        assert.true(result);
    })
})

QUnit.module('validateAccount', () => {
    QUnit.test('Should return a 2 blocks long Blockchain', async (assert) => {
        const result = await validateAccount(validBirthBlock(), keypair2);

        assert.equal(result.length, 2);
    })

    QUnit.test('Should return unmodified birth block', async (assert) => {
        const bb = validBirthBlock();
        const result = await validateAccount(bb, keypair2);

        assert.equal(result[1], bb);
    })

    QUnit.test('Should return a valid initialization block', async (assert) => {
        const result = await validateAccount(validBirthBlock(), keypair2);

        assert.true(keypair2.verify(hashblock(result[0]), result[0].h));

        delete result[0].h;

        const expectedInitializationBlock = {
            b: 0,
            d: new Date().toISOString().slice(0, 10),
            g: {},
            ph:  "3046022100a79541ba6261790d13bfaf2d4177a0a645a3baade652bbc31daf0e2b6801300c022100de8f9ad1842e5634dd8027c1e4c90026303f201a00322df4a76e6330943702bb",
            s: "03cbe4edbfbbc99dfbae83e8c591fafdd6a82d61589be6f60775e3fe2a4677ef46",
            t: 0,
            v: 1
        };

        assert.deepEqual(result[0], expectedInitializationBlock);
    })
})

QUnit.module('updateBlockchain', () => {
    QUnit.test("Should return the new blockchain if it's ok", (assert) => {
        const oldBC = [];
        const newBC = [validBirthBlock()];
        const result = updateBlockchain(oldBC, newBC);

        assert.equal(result, newBC);
    })

    QUnit.test("Should raise error if new does not start old", (assert) => {
        const oldBC = [validBirthBlock()];
        const newBC = [];

        assert.throws(() => {
                updateBlockchain(oldBC, newBC)
            },
            ( err ) => err.toString() === "Invalid new Blockchain",
            "No error thrown"
        );
    })

    QUnit.test("Should raise error if new does not start old (long bc)", (assert) => {

        const oldBC = [validBirthBlock(), validBirthBlock(), validBirthBlock(), validBirthBlock()];
        const newBC = [validBirthBlock(), validBirthBlock(), validBirthBlock()];

        assert.throws(() => {
                updateBlockchain(oldBC, newBC)
            },
            ( err ) => err.toString() === "Invalid new Blockchain",
            "No error thrown"
        );
    })

    QUnit.test("Should be OK to replace blockchain by itself", (assert) => {
        const bc = [validBirthBlock(), validBirthBlock(), validBirthBlock(), validBirthBlock()];
        const result = updateBlockchain(bc, bc);
        assert.equal(result, bc);
    })
})

QUnit.module('blockchain', () => {
    QUnit.module('getLevel', () => {
        QUnit.test("Should return 0 for empty blockchain", (assert) => {
            const bc = basicBlockchainToObject();
            const result = bc.getLevel();

            assert.equal(result, 0);
        })
        QUnit.test("Should return 2 for t=1 to 3", (assert) => {
            const bc = basicBlockchainToObject(validBlockchain());
            bc[0].t = 1;
            assert.equal(bc.getLevel(), 2);
            bc[0].t = 2;
            assert.equal(bc.getLevel(), 2);
            bc[0].t = 3;
            assert.equal(bc.getLevel(), 2);

        })
    })

    QUnit.module('getGuzisBeforeNextLevel', () => {
        QUnit.test("Should return 0 for empty blockchain", (assert) => {
            const bc = basicBlockchainToObject();
            const result = bc.getGuzisBeforeNextLevel();

            assert.equal(result, 0);
        })

        QUnit.test("Should return 16 for total at 11 (target is 27)", (assert) => {
            const bc = basicBlockchainToObject(validBlockchain());
            bc[0].t = 11;
            const result = bc.getGuzisBeforeNextLevel();

            assert.equal(result, 16);
        })

        QUnit.test("Should return percent if as_percent is true", async (assert) => {
            let bc = basicBlockchainToObject(validBlockchain());
            bc[0].t = 11;

            const result = bc.getGuzisBeforeNextLevel(true);

            //TODO
            assert.equal(result, 15);
        })
    })

    QUnit.module('getGuzis', () => {
        QUnit.test("Should return 0 for empty blockchain", (assert) => {
            const bc = basicBlockchainToObject();
            const result = bc.getGuzis();

            assert.equal(result, 0);
        })

        QUnit.test("Should return 0 for created blockchain", (assert) => {
            const bc = basicBlockchainToObject([]);
            const result = bc.getGuzis();

            assert.equal(result, 0);
        })

        QUnit.test("Should return 0 for validation waiting blockchain", (assert) => {
            const bc = basicBlockchainToObject([validBirthBlock()]);
            const result = bc.getGuzis();

            assert.equal(result, 0);
        })

        QUnit.test("Should return last block g for valid blockchain", async (assert) => {
            let bc = basicBlockchainToObject([validInitBlock(), validBirthBlock()]);
            bc[0].t = 27;
            await bc.addTx(await bc.createDailyGuzisTx(keypair, "2021-09-25"));
            await bc.addTx(await bc.createDailyGuzisTx(keypair, "2021-09-26"));
            const result = bc.getGuzis();

            assert.equal(result, 8);
        })
    })

    QUnit.module('isEmpty', () => {
        QUnit.test("Should return false for empty array", (assert) => {
            const bc = basicBlockchainToObject([]);
            const result = bc.isEmpty();

            assert.false(result);
        }),

        QUnit.test("Should return true for empty blockchain", (assert) => {
            const bc = basicBlockchainToObject();
            const result = bc.isEmpty();

            assert.true(result);
        })

        QUnit.test("Should return true for null blockchain", (assert) => {
            const bc = basicBlockchainToObject(null);
            const result = bc.isEmpty();

            assert.true(result);
        })
    })

    QUnit.module('isCreated', () => {
        QUnit.test("Should return false for null blockchain", (assert) => {
            const bc = basicBlockchainToObject();
            const result = bc.isCreated();

            assert.false(result);
        }),

        QUnit.test("Should return false for blockchain waiting for validation", (assert) => {
            const bc = basicBlockchainToObject([validBirthBlock()]);
            const result = bc.isCreated();

            assert.false(result);
        }),

        QUnit.test("Should return true for valid blockchain", (assert) => {
            const bc = basicBlockchainToObject([]);
            const result = bc.isCreated();

            assert.true(result);
        })
    })

    QUnit.module('isWaitingValidation', () => {
        QUnit.test("Should return false for empty blockchain", (assert) => {
            const bc = basicBlockchainToObject();
            const result = bc.isWaitingValidation();

            assert.false(result);
        }),

        QUnit.test("Should return false for only created blockchain", (assert) => {
            const bc = basicBlockchainToObject([]);
            const result = bc.isWaitingValidation();

            assert.false(result);
        }),

        QUnit.test("Should return false totally valid blockchain", (assert) => {
            const bc = basicBlockchainToObject([validBirthBlock(), validBirthBlock()]);
            const result = bc.isWaitingValidation();

            assert.false(result);
        }),

        QUnit.test("Should return false if the block is not a birth one", (assert) => {
            const bc = basicBlockchainToObject([validInitBlock()]);
            const result = bc.isWaitingValidation();

            assert.false(result);
        }),

        QUnit.test("Should return true for blockchain effectively waiting for validation", (assert) => {
            const bc = basicBlockchainToObject([validBirthBlock()]);
            const result = bc.isWaitingValidation();

            assert.true(result);
        })
    })

    QUnit.module('isValidated', () => {
        QUnit.test("Should return false for empty blockchain", (assert) => {
            const bc = basicBlockchainToObject();
            const result = bc.isValidated();

            assert.false(result);
        }),

        QUnit.test("Should return false for only created blockchain", (assert) => {
            const bc = basicBlockchainToObject([]);
            const result = bc.isValidated();

            assert.false(result);
        }),

        QUnit.test("Should return false if the first block is not a birth one", (assert) => {
            const bc = basicBlockchainToObject([validInitBlock(), validInitBlock()]);
            const result = bc.isValidated();

            assert.false(result);
        }),

        QUnit.test("Should return true totally valid blockchain", (assert) => {
            const bc = basicBlockchainToObject([validInitBlock(), validBirthBlock()]);
            const result = bc.isValidated();

            assert.true(result);
        })
    })

    QUnit.module('createDailyGuzis', () => {
        QUnit.test("Should return null if Guzis have already been created today.", async (assert) => {
            const bc = basicBlockchainToObject(validBlockchain());
            await bc.addTx(await bc.createDailyGuzisTx(keypair));
            const result = await bc.createDailyGuzisTx(keypair);

            assert.notOk(result);
        })

        QUnit.test("Should return blockchain in OK case.", async (assert) => {
            let bc = basicBlockchainToObject(validBlockchain());
            await bc.addTx(await bc.createDailyGuzisTx(keypair));
            const result = bc[0].tx[0]

            assert.true(keypair.verify(hashtx(result), result.h));
            delete result.h;

            const d = new Date().toISOString().slice(0, 10);
            const expectedGP = {};
            expectedGP[d] = [0];
            const expected = {
                v: 1,
                t: 0,
                d: d,
                s: "02c85e4e448d67a8dc724c620f3fe7d2a3a3cce9fe905b918f712396b4f8effcb3",
                a: 1,
                gp: expectedGP
            }

            assert.deepEqual(result, expected);
        })

        QUnit.test("Should create 1+Total^(1/3) Guzis.", async (assert) => {
            let bc = basicBlockchainToObject(validBlockchain());
            bc[0].t = 27; // => 3 +1 Guzi/day
            await bc.addTx(await bc.createDailyGuzisTx(keypair));
            const result = bc[0].tx[0]

            assert.true(keypair.verify(hashtx(result), result.h));
            delete result.h;

            const d = new Date().toISOString().slice(0, 10);
            const expectedGP = {};
            expectedGP[d] = [0, 1, 2, 3];
            const expected = {
                v: 1,
                t: 0,
                d: d,
                s: "02c85e4e448d67a8dc724c620f3fe7d2a3a3cce9fe905b918f712396b4f8effcb3",
                a: 4,
                gp: expectedGP
            }

            assert.deepEqual(result, expected);
        })
    })

    QUnit.module('getAvailableGuzis', () => {
        QUnit.test("Should return {} for new Blockchain.", async (assert) => {
            const bc = basicBlockchainToObject(validBlockchain());
            const result = bc.getAvailableGuzis();

            const expected = {};

            assert.deepEqual(result, expected);
        })

        QUnit.test("Should return each index.", async (assert) => {
            let bc = basicBlockchainToObject(validBlockchain());
            bc[0].t = 27;
            await bc.addTx(await bc.createDailyGuzisTx(keypair, "2021-09-25"));
            const result = bc.getAvailableGuzis();

            const expected = {"2021-09-25": [0, 1, 2, 3]};

            assert.deepEqual(result, expected);
        })

        QUnit.test("Should return each date.", async (assert) => {
            let bc = basicBlockchainToObject(validBlockchain());
            bc[0].t = 27;
            const d1 = "2021-09-23";
            const d2 = "2021-09-24";
            const d3 = "2021-09-25";
            await bc.addTx(await bc.createDailyGuzisTx(keypair, d1));
            await bc.addTx(await bc.createDailyGuzisTx(keypair, d2));
            await bc.addTx(await bc.createDailyGuzisTx(keypair, d3));
            const result = bc.getAvailableGuzis();

            const expected = {};
            expected[d1] = [0, 1, 2, 3];
            expected[d2] = [0, 1, 2, 3];
            expected[d3] = [0, 1, 2, 3];

            assert.deepEqual(result, expected);
        })

        QUnit.test("Should return only given amount if given.", async (assert) => {
            let bc = basicBlockchainToObject(validBlockchain());
            bc[0].t = 27;
            const d = "2021-09-25";
            await bc.addTx(await bc.createDailyGuzisTx(keypair, d));
            const result = bc.getAvailableGuzis(2);

            const expected = {};
            expected[d] = [0, 1];

            assert.deepEqual(result, expected);
        })

        QUnit.test("Should return only given amount for complexe cases.", async (assert) => {
            let bc = basicBlockchainToObject(validBlockchain());
            bc[0].t = 27;
            const d1 = "2021-09-23";
            const d2 = "2021-09-24";
            const d3 = "2021-09-25";
            await bc.addTx(await bc.createDailyGuzisTx(keypair, d1));
            await bc.addTx(await bc.createDailyGuzisTx(keypair, d2));
            await bc.addTx(await bc.createDailyGuzisTx(keypair, d3));
            const result = bc.getAvailableGuzis(7);

            const expected = {};
            expected[d1] = [0, 1, 2, 3];
            expected[d2] = [0, 1, 2];

            assert.deepEqual(result, expected);
        })

        QUnit.test("Should return only unspent Guzis.", async (assert) => {
            let bc = basicBlockchainToObject(validBlockchain());
            bc[0].t = 27;
            const d1 = "2021-09-23";
            const d2 = "2021-09-24";
            const d3 = "2021-09-25";
            await bc.addTx(await bc.createDailyGuzisTx(keypair, d1));
            await bc.addTx(await bc.createDailyGuzisTx(keypair, d2));
            await bc.addTx(await bc.createDailyGuzisTx(keypair, d3));
            const contacts = [{id:0, key: keypair.getPublic(true, 'hex')}];
            await bc.addTx(await bc.createPaymentTx(keypair, keypair2.getPublic(true, 'hex'), 7), contacts);
            const result = bc.getAvailableGuzis();

            const expected = {};
            expected[d2] = [3];
            expected[d3] = [0, 1, 2, 3];

            assert.deepEqual(result, expected);
        })
    })

    QUnit.module('createPaymentTx', () => {
        QUnit.test("Should make valid transaction.", async (assert) => {
            let bc = basicBlockchainToObject(validBlockchain());
            bc[0].t = 27;
            await bc.addTx(await bc.createDailyGuzisTx(keypair, "2021-09-25"));
            const contacts = [{id:0, key: keypair.getPublic(true, 'hex')}];
            await bc.addTx(await bc.createPaymentTx(keypair, keypair2.getPublic(true, 'hex'), 3, "2021-09-25"), contacts);
            const result = bc[0].tx[0];

            assert.true(keypair.verify(hashtx(result), result.h));
            delete result.h;

            const expected = {
                a: 3,
                d: "2021-09-25",
                gp: {"2021-09-25": [0, 1, 2]},
                s: keypair.getPublic(true, 'hex'),
                t: TXTYPE.PAYMENT,
                tu: keypair2.getPublic(true, 'hex'),
                v: CUR_VERSION,
            }

            assert.deepEqual(result, expected);
        })
    })

    QUnit.module('addTx', () => {
        QUnit.test("Should increase g of the block for tx of type guzi creation.", async (assert) => {
            let bc = basicBlockchainToObject(validBlockchain());
            bc[0].t = 27;
            const d = "2021-09-25";
            await bc.addTx(await bc.createDailyGuzisTx(keypair, d));
            const result = bc[0].g;
            const expected = {};
            expected[d] = [0, 1, 2, 3];

            assert.deepEqual(result, expected);
        })

        QUnit.test("Should decrease g of the block for tx of type payment.", async (assert) => {
            let bc = basicBlockchainToObject(validBlockchain());
            bc[0].t = 27;
            const d1 = "2021-09-23";
            const d2 = "2021-09-24";
            const d3 = "2021-09-25";
            await bc.addTx(await bc.createDailyGuzisTx(keypair, d1));
            await bc.addTx(await bc.createDailyGuzisTx(keypair, d2));
            await bc.addTx(await bc.createDailyGuzisTx(keypair, d3));
            const contacts = [{id:0, key: keypair.getPublic(true, 'hex')}];
            await bc.addTx(await bc.createPaymentTx(keypair, keypair2.getPublic(true, 'hex'), 7), contacts);
            const result = bc[0].g;
            const expected = {};
            expected[d2] = [3];
            expected[d3] = [0, 1, 2, 3];

            assert.deepEqual(result, expected);
        })
    })
})
