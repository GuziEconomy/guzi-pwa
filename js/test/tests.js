const ec = new elliptic.ec('secp256k1');
// ({ "priv":"ed945716dddb7af2c9774939e9946f1fee31f5ec0a3c6ec96059f119c396912f",
// "pub":[
//     "c85e4e448d67a8dc724c620f3fe7d2a3a3cce9fe905b918f712396b4f8effcb3",
//     "ab1b8f3ba4816171fa61c3940f157d3136a786f03411cd5e19e0ba43d9104d60"
// ]});

const keypair = ec.keyFromPrivate("ed945716dddb7af2c9774939e9946f1fee31f5ec0a3c6ec96059f119c396912f", "hex");

const validInitializationBlock = {
    b: 0,
    d: "28/11/1989",
    g: 0,
    h: "304502210090a497dff151e45648b3306eaf3005975ec180cec37ca31b91d660148938f9c7022023a36ec248bcd8762e570d36c1f7523e8fd4f8611d1d723ba994bd3ae25352ed",
    ph: "c1a551ca1c0deea5efea51b1e1dea112ed1dea0a5150f5e11ab1e50c1a15eed5",
    s: "02e31267fc0e24e6a3da9e40fedb23f98c750bddb3278a1873ab49c601f3bbd66b",
    t: 0,
    v: 1
}

QUnit.module('makeBirthBlock', () => {
    QUnit.test('Should return corectly filled block', (assert) => {
        const birthdate = "12/12/2002";
        const publicHexKey = "000000000000000000000000000000000000000000000000000000000000000000";

        const block = makeBirthBlock(birthdate, publicHexKey);

        const expected = {
            v: 1,
            d: birthdate,
            ph: "c1a551ca1c0deea5efea51b1e1dea112ed1dea0a5150f5e11ab1e50c1a15eed5",
            s: publicHexKey,
            g: 0, b: 0, t: 0,
        }

        assert.deepEqual(block, expected);
    })
})


QUnit.module('hashblock', () => {
    QUnit.test('Should make valid hash', async (assert) => {
        const block = {
            v: 1,
            d: "28/11/1989",
            ph: "c1a551ca1c0deea5efea51b1e1dea112ed1dea0a5150f5e11ab1e50c1a15eed5",
            s: "02c85e4e448d67a8dc724c620f3fe7d2a3a3cce9fe905b918f712396b4f8effcb3",
            g: 0, b: 0, t: 0,
        };

        const expected = "cd46dbbf4deef70d7519f3e5dc825311bd0935c958571f87e399a860d1aac5cd";

        result = hashblock(block);

        assert.equal(result, expected);
    })
})

QUnit.module('signblock', () => {
    QUnit.test('Should make valid signature', async (assert) => {
        const block = {
            v: 1,
            d: "28/11/1989",
            ph: "c1a551ca1c0deea5efea51b1e1dea112ed1dea0a5150f5e11ab1e50c1a15eed5",
            s: "02c85e4e448d67a8dc724c620f3fe7d2a3a3cce9fe905b918f712396b4f8effcb3",
            g: 0, b: 0, t: 0,
        };

        const expected = {
            v: 1,
            d: "28/11/1989",
            ph: "c1a551ca1c0deea5efea51b1e1dea112ed1dea0a5150f5e11ab1e50c1a15eed5",
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
            ph: "c1a551ca1c0deea5efea51b1e1dea112ed1dea0a5150f5e11ab1e50c1a15eed5",
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
            ph: "c1a551ca1c0deea5efea51b1e1dea112ed1dea0a5150f5e11ab1e50c1a15eed5",
            s: "02c85e4e448d67a8dc724c620f3fe7d2a3a3cce9fe905b918f712396b4f8effcb3",
            g: 0, b: 0, t: 0,
            h: "3045022100fa8fa6d39457649ba21cca129ec6c3b41bb2dbb4247dd47a5491cb3567fad5d30220434ef707b7a044e05646a564445a279e4ffab7b00a9649e8a2d7fce165c3a8ad"
        }];

        const expected = "9188a17601a164aa32382f31312f31393839a27068d94063316135353163613163306465656135656665613531623165316465613131326564316465613061353135306635653131616231653530633161313565656435a173d942303263383565346534343864363761386463373234633632306633666537643261336133636365396665393035623931386637313233393662346638656666636233a16700a16200a17400a168d98e33303435303232313030666138666136643339343537363439626132316363613132396563366333623431626232646262343234376464343761353439316362333536376661643564333032323034333465663730376237613034346530353634366135363434343561323739653466666162376230306139363439653861326437666365313635633361386164";

        const result = exportBlockchain(bc);

        assert.equal(result, expected);
    })
})

QUnit.module('isValidBC', () => {
    QUnit.test('Should return false for empty string', (assert) => {
        const result = isValidBC("");

        assert.false(result);
    })

    QUnit.test('Should return false for empty array', (assert) => {
        const result = isValidBC([]);

        assert.false(result);
    })

    QUnit.test('Should return false for not array (string)', (assert) => {
        const result = isValidBC("hello world");

        assert.false(result);
    })

    QUnit.test('Should return false for not array (object)', (assert) => {
        const result = isValidBC({});

        assert.false(result);
    })

    QUnit.test('Should return true for valid json', (assert) => {
        const result = isValidBC([{b: 0,
            d: "",
            g: 0,
            ph: "c1a551ca1c0deea5efea51b1e1dea112ed1dea0a5150f5e11ab1e50c1a15eed5",
            s: "03fd0a4bfe8b7a431576916e5a30b149027e5fb902f6f117f440a1bb43df5897b5",
            t: 0,
            v: 1}]);

        assert.true(result);
    })
})

QUnit.module('isValidInitializationBlock', () => {
    QUnit.test('Should return true for valid block', (assert) => {
        const result = isValidInitializationBlock(validInitializationBlock);

        assert.true(result);
    })
})
