//The code below works only upto version "@aws-crypto/client-node": "^1.7.0"

//This line is critical as we have to use the buildClient and CommitmentPolicy, use of direct encrypt and decrypt is deprecated.
const { buildClient, CommitmentPolicy, KmsKeyringNode } = require("@aws-crypto/client-node");

let response;

exports.lambdaHandler = async (event, context, callback) => {
    try {
        //Plain text to encrypt
        let plainText = "test123";

        //Replace this with your actual key id
        let keyId = "arn:aws:kms:ap-south-1:521203888738:key/8902f695-da7b-4311-b163-58c95fe5845c";

        //generatorKeyId needs to be mentioned in the parameter as it is not the first one in the order.
        const keyring = new KmsKeyringNode({ generatorKeyId : keyId });

        //Use encryption context for your purpose.
        let context = { "Password": "CheckIntegrity" }

        //This calls local function implemented below.
        let encryptedData = await encryptData(keyring, plainText, context);
        
        //encryptedData is a Buffer, it needs to be base64 converted if you want to ship it to some other config file or other destination.
        let encryptedString = encryptedData.toString('base64');

        console.log("===== Encrypted Data ======");
        console.log(encryptedString);
        //Below is the base64 encrypted string logged.
        //AYADeMbYYXeMXZQzmsveOMBBk6gAeQACABVhd3MtY3J5cHRvLXB1YmxpYy1rZXkAREE0dy9NTWdHbXhQLzVVTmVwcUthd1hvUlNhT1pXYUkydTdQUGxVWk5yMlp1SVBVRzBFeXkyTCtoOGtwanJVdTgydz09AAhQYXNzd29yZAAOQ2hlY2tJbnRlZ3JpdHkAAQAHYXdzLWttcwBMYXJuOmF3czprbXM6YXAtc291dGgtMTo1MjEyMDM4ODg3Mzg6a2V5Lzg5MDJmNjk1LWRhN2ItNDMxMS1iMTYzLTU4Yzk1ZmU1ODQ1YwC4AQIBAHigRP/+27vv7znLZL3Q/V/X4OxDocGaBZgA2x39jtJMWgGN6dtgAQX2guNpl+9/3GIRAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMa18zS1RblBw6LGnpAgEQgDsxXDyR/U3/RDKkXQbcV0SMnFYL+eW0tzkQ6aQAGSZmb+ooQXbZ06Pq10uMPnkODwpFLi/AerFjEXMbHQIAAAAADAAAEAAAAAAAAAAAAAAAAABXfGp+QHzsnzNpbJ3m1FMT/////wAAAAEAAAAAAAAAAAAAAAEAAAAHxD9QjqV7igNiI8IxY3RZLE4nnxj+IuYAZjBkAjBNAV9+BZtsSepmKvNyCZ9OFjVSFle/Q0uo7LL8G1fphLn/YUWN6FvekeuAvmZNg6wCMAZDSMCfhh+uGO4bEYljUt3DwbE7iSB/mfnwlqRI9fmhat560H9H7DglxXiBRYqccA==
        
        //I am taking this base64 encrypted string as input for decryption. This can come from config file or any other source.
        let base64EncryptedString = "AYADeMbYYXeMXZQzmsveOMBBk6gAeQACABVhd3MtY3J5cHRvLXB1YmxpYy1rZXkAREE0dy9NTWdHbXhQLzVVTmVwcUthd1hvUlNhT1pXYUkydTdQUGxVWk5yMlp1SVBVRzBFeXkyTCtoOGtwanJVdTgydz09AAhQYXNzd29yZAAOQ2hlY2tJbnRlZ3JpdHkAAQAHYXdzLWttcwBMYXJuOmF3czprbXM6YXAtc291dGgtMTo1MjEyMDM4ODg3Mzg6a2V5Lzg5MDJmNjk1LWRhN2ItNDMxMS1iMTYzLTU4Yzk1ZmU1ODQ1YwC4AQIBAHigRP/+27vv7znLZL3Q/V/X4OxDocGaBZgA2x39jtJMWgGN6dtgAQX2guNpl+9/3GIRAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMa18zS1RblBw6LGnpAgEQgDsxXDyR/U3/RDKkXQbcV0SMnFYL+eW0tzkQ6aQAGSZmb+ooQXbZ06Pq10uMPnkODwpFLi/AerFjEXMbHQIAAAAADAAAEAAAAAAAAAAAAAAAAABXfGp+QHzsnzNpbJ3m1FMT/////wAAAAEAAAAAAAAAAAAAAAEAAAAHxD9QjqV7igNiI8IxY3RZLE4nnxj+IuYAZjBkAjBNAV9+BZtsSepmKvNyCZ9OFjVSFle/Q0uo7LL8G1fphLn/YUWN6FvekeuAvmZNg6wCMAZDSMCfhh+uGO4bEYljUt3DwbE7iSB/mfnwlqRI9fmhat560H9H7DglxXiBRYqccA==";

        //This calls local function implemented below. Note that we have to mention base64 when converting to Buffer. Also note though context is passed, it is not used in decryption.
        let decryptedData = await decryptData(keyring, Buffer.from(base64EncryptedString, 'base64'), context);

        //This is the final decrypted code that matches with plainText used above. 
        console.log("===== Decrypted Data ======");
        console.log(decryptedData);

        response = {
            'statusCode': 200,
            'body': decryptedData
        }
    } catch (err) {
        console.log(err);
        return err;
    }

    return response;
};

encryptData = async (keyring, plainText, context) => {
    try {
        //We have to use encrypt from buildContext, not directly. This line is critical.
        const { encrypt } = buildClient(CommitmentPolicy.FORBID_ENCRYPT_ALLOW_DECRYPT)

        //keyring and encryptionContext are used here.
        const { result } = await encrypt(keyring, plainText, { encryptionContext: context });

        return result;
    } catch (e) {
        console.log(e);
    }
};

decryptData = async (keyring, encryptedData, context) => {
    try {
        //We have to use encrypt from buildContext, not directly. This line is critical.
        const { decrypt } = buildClient(CommitmentPolicy.FORBID_ENCRYPT_ALLOW_DECRYPT)

        //Note context is not used and not required for decrypting. Only keyring is required.
        const { plaintext } = await decrypt(keyring, encryptedData);

        //Converting to string.
        return plaintext.toString();
    } catch (e) {
        console.log(e);
    }
};

//Output:
//2021-07-16T13:21:41.185Z	afcdf538-dfca-4291-8406-a0e3d0102585	INFO	===== Encrypted Data ======
//2021-07-16T13:21:41.185Z	afcdf538-dfca-4291-8406-a0e3d0102585	INFO	AYADeIGasolP5wArW/4X9W4I/9sAeQACABVhd3MtY3J5cHRvLXB1YmxpYy1rZXkAREEzaTg0L0FvbGlXMU5qNnRSSHlnL1cybUJQRkpHenNuMmt1ekNSTzJ3Smt3OWNjbGVPVyt6NUVvWmNRTnNVTTJOUT09AAhQYXNzd29yZAAOQ2hlY2tJbnRlZ3JpdHkAAQAHYXdzLWttcwBMYXJuOmF3czprbXM6YXAtc291dGgtMTo1MjEyMDM4ODg3Mzg6a2V5Lzg5MDJmNjk1LWRhN2ItNDMxMS1iMTYzLTU4Yzk1ZmU1ODQ1YwC4AQIBAHigRP/+27vv7znLZL3Q/V/X4OxDocGaBZgA2x39jtJMWgEKkDhH5GITpy1TzreYSBa2AAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMAm8uQgIaIXAzcIT8AgEQgDtPNUKgz0qmjLKM6kUiaIpA9RHAXT2J1JZvZJrfm59nu13sIpxaIb263SyuvgveIV9e/7tcAfLYieyDQwIAAAAADAAAEAAAAAAAAAAAAAAAAAAUb44ynB2KaY0W1jUiSfdd/////wAAAAEAAAAAAAAAAAAAAAEAAAAHzPPyfOto2iBgRTzZRqdifZCvwX8gdhwAZjBkAjBlFeQmCt2nVAriUou6VoWlajoVwspVps+/2fmMzc7GelYOLCxqQsBL1XWaNOohxNMCMD7v+n5ULQ3gJkLtEhRkpQbdtrhnsvSFOYu6h0DSPjQKsCHiwEknmjS0bL2dsI2f7g==
//2021-07-16T13:21:41.352Z	afcdf538-dfca-4291-8406-a0e3d0102585	INFO	===== Decrypted Data ======
//2021-07-16T13:21:41.353Z	afcdf538-dfca-4291-8406-a0e3d0102585	INFO	test123