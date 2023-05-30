import StreamZip from "node-stream-zip";
import {CORE2169FileData, CORE2169FileMetaData} from "@/models";
import iconv from "iconv-lite";
import {Utils} from "@/utils";
import {PageView} from "@/app/core-2169/PageView";
import {Suspense} from "react";

export default async function CORE2169() {
  const data = await parseFile()
  const filesMetaData = getFilesMetaData()

  return (
    <div className="core-2169 w-full">
      <Suspense fallback={<p>Loading feed...</p>}>
        <PageView filesMetaData={filesMetaData} data={data} />
      </Suspense>
    </div>
  )
}

async function parseFile(): Promise<CORE2169FileData> {
  const core2169: CORE2169FileData = {
    PEFCHI_40: [],
    PEFCHI_94: [],
    PEFCHI_13: [],
    PEFCHI_R0: [],
  }
// private static final int PEFCHIR0_IBM_1047_FILE_LENGTH = 1155;
// private static final int PEFCHIR0_UTF_16_LE_FILE_LENGTH = 576;
// private static final int PEFCHI13_IBM_1047_FILE_LENGTH = 1918;
// private static final int PEFCHI13_UTF_16_LE_FILE_LENGTH = 959;
  const zip = new StreamZip({
    file: "./public/CORE-2169-test-files.zip",
    storeEntries: true
  })

 return new Promise((resolve) => {
    zip.on('ready', () => {
      // Take a look at the files
      console.log('Entries read: ' + zip.entriesCount);
      for (const entry of Object.values(zip.entries())) {
        const desc = entry.isDirectory ? 'directory' : `${entry.size} bytes`;
        console.log(`Entry ${entry.name}: ${desc}`);
        const fileName = entry.name
        if (fileName.includes('PE3T.HOSTPC.PE3TOCRM.FATCA')) {
          const data = iconv.decode(zip.entryDataSync(entry), "utf32le");
          const dataArray = data.split('\r\n');
          dataArray.splice(0, 1);
          dataArray.splice(-1);
          core2169.PEFCHI_94 = mappingRowData(dataArray, getPEFCHI94FileMetaData())
        } else if (fileName.includes('PE3T.PEPD0015.BAT1SBAS.OPEMHI13')) {
          core2169.PEFCHI_13 = parseBinaryData(zip.entryDataSync(entry), getPEFCHI13FileMetaData(), 1918)
        } else if (fileName.includes('PE3T.PEPD0015.BAT1SBAS.OPEMHI40')) {
          const data = zip.entryDataSync(entry).toString('utf8')
          core2169.PEFCHI_40 = mappingRowData(data.split('\r\n'), getPEFCHI40FileMetaData())
        } else if (fileName.includes('PE3T.PEPD0015.BAT1SBAS.OPEMHIR0')) {
          core2169.PEFCHI_R0 = parseBinaryData(zip.entryDataSync(entry), getPEFCHIR0FileMetaData(), 1155)
        }
      }
      zip.close()
      resolve(core2169)
    });
  })
}

const mappingRowData = (data: string[], fileMetaData: CORE2169FileMetaData[]) => {
  const rows: CORE2169FileMetaData[][] = []
  if(data?.length ?? 0 > 0) {
    let offset = 0;
    for(const rowData of data ?? '') {
      if(rowData.length > 0) {
        const row: CORE2169FileMetaData[] = []
        offset = 0
        for (const column of fileMetaData) {
          let value = rowData.substring(offset, offset + column.length)
          offset += column.length
          row.push({
            ...column,
            value,
          })
        }
        rows.push(row)
      }
    }
  }
  return rows;
}
const parseBinaryData = (dataRows: Buffer, metaData: CORE2169FileMetaData[], rowLength: number): CORE2169FileMetaData[][] => {
  const rows: CORE2169FileMetaData[][] = []
  let offset = 0, value = '';
  let totalLength = 0;
  let rowsNum = dataRows.length / rowLength;
  for(let i = 0; i < rowsNum; i++) {
    const row: CORE2169FileMetaData[] = [];
    for(const column of metaData) {
        let textLength =  column.length;
        if(column.isUTF_16) {
          textLength =  column.length * 2;
          const hexValue = dataRows?.toString('hex', offset, offset + textLength) ?? ''
          value = Buffer.from(hexValue, 'hex').swap16().toString('utf16le')
        } else {
          const hexValue = dataRows?.toString('hex', offset, offset + textLength) ?? ''
          value = Utils.convertIBM1047ToASCII(hexValue, textLength)[0]
        }
        offset += textLength;
        totalLength += textLength;
        row.push({
          ...column,
          value,
        })
    }
    rows.push(row)
  }
  return rows
}
const getFilesMetaData = () => {
  return {
    "PEFCHI_40": getPEFCHI40FileMetaData(),
    "PEFCHI_13": getPEFCHI13FileMetaData(),
    "PEFCHI_R0": getPEFCHIR0FileMetaData(),
    "PEFCHI_94": getPEFCHI94FileMetaData(),
  }
}
const getPEFCHI40FileMetaData = (): CORE2169FileMetaData[] => {
  return [
    {
      "fieldID": "COD-ENTITY",
      "description": "Entity – Entity in which the registration occurs",
      "length": 4,
      isUse: false,
    },
    {
      "fieldID": "COD-OPER",
      "description": "A for new record, M for modifications, D for delete",
      "length": 1,
      isUse: true,
    },
    {
      "fieldID": "STATUS",
      "description": "Flag to indicate the status of the record (after or before image)",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "NUM-CUS",
      "description": "Customer Internal ID – Internal sequential number given by the module to identify a unique customer",
      "length": 8,
      isUse: true,
    },
    {
      "fieldID": "COD-ID",
      "description": "Document type",
      "length": 1,
      isUse: true,
    },
    {
      "fieldID": "KEY-ID",
      "description": "Document Issued Country",
      "length": 25,
      isUse: true,
    },
    {
      "fieldID": "COD-ISS-CTRY",
      "description": "Application Code – The code of the non-Alnova application",
      "length": 3,
      isUse: true,
    },
    {
      "fieldID": "TYP-APP",
      "description": "Non-Alnova account number ",
      "length": 3,
      isUse: false,
    },
    {
      "fieldID": "NUM-ACC-EXT",
      "description": "Account Key – Alnova Account",
      "length": 20,
      isUse: false,
    },
    {
      "fieldID": "KEY-ENTITY",
      "description": "Entity code",
      "length": 4,
      isUse: false,
    },
    {
      "fieldID": "BRN-OPEN",
      "description": "Branch or center code; part of the account number",
      "length": 4,
      isUse: false,
    },
    {
      "fieldID": "NUM-ACCOUNT",
      "description": "Account number",
      "length": 10,
      isUse: false,
    },
    {
      "fieldID": "KEY-PARTIC",
      "description": "Account Participation Type (Current Relation Code)",
      "length": 2,
      isUse: false,
    },
    {
      "fieldID": "PARTSEQ",
      "description": "The Sequence number of the account participation Type",
      "length": 2,
      isUse: false,
    },
    {
      "fieldID": "REL-STATUS",
      "description": "Status of the relationship between the customer and the account (A for active, C for closed)",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "AC-STATUS",
      "description": "Account Status – Status of the product contracted by the customer (Blank for active, ‘P’ for Prospect, and 'C' for closed)",
      "length": 1,
      isUse: true,
    },
    {
      "fieldID": "DAT-CREATION",
      "description": "Creation Date – Customer-account creation date",
      "length": 10,
      isUse: false,
    },
    {
      "fieldID": "USR-CREATION",
      "description": "Create By – Customer-account creation party",
      "length": 8,
      isUse: true,
    },
    {
      "fieldID": "DAT-LASTMOD",
      "description": "Update Date – Customer-account last update date",
      "length": 26,
      isUse: true,
    },
    {
      "fieldID": "USR-LASTMOD",
      "description": "Update By – Customer-account last update user id",
      "length": 8,
      isUse: true,
    },
    {
      "fieldID": "BRN-REG",
      "description": "Registration Branch",
      "length": 4,
      isUse: true,
    },
    {
      "fieldID": "BRN-LASTMOD",
      "description": "Record Last Update By Branch",
      "length": 4,
      isUse: false,
    },
    {
      "fieldID": "ENT-LASTMOD",
      "description": "Record Last Update By Entity",
      "length": 4,
      isUse: false,
    },
    {
      "fieldID": "COD-PRODSERV",
      "description": "PRODSERV Code",
      "length": 2,
      isUse: false,
    },
    {
      "fieldID": "COD-SPROD",
      "description": "SPROD Code",
      "length": 4,
      isUse: true,
    },
    {
      "fieldID": "FLG-FREE",
      "description": "Statement Type",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "FILLER",
      "description": "Filler",
      "length": 43,
      isUse: false,
    }
  ]
}
const getPEFCHI13FileMetaData = (): CORE2169FileMetaData[] => {
  return [
    {
      "fieldID": "COD-ENTITY",
      "description": "Entity - The entity of which the customer belongs to",
      "length": 4,
      isUse: true,
    },
    {
      "fieldID": "COD-OPER",
      "description": "A for new record, M for modifications, D for delete",
      "length": 1,
      isUse: true,
    },
    {
      "fieldID": "STATUS",
      "description": "Flag to indicate the status of the record (after or before image)",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "NUM-CUS",
      "description": "Customer Internal ID – Internal sequential number given by the module to identify a unique customer",
      "length": 8,
      isUse: true,
    },
    {
      "fieldID": "COD-ID",
      "description": "Document Type",
      "length": 1,
      isUse: true,
    },
    {
      "fieldID": "KEY-ID",
      "description": "Document Identification Number",
      "length": 25,
      isUse: true,
    },
    {
      "fieldID": "COD-ISS-CTRY",
      "description": "Document Issued Country",
      "length": 3,
      isUse: true,
    },
    {
      "fieldID": "DAT-DOCUMENT-EXP",
      "description": "Document Expiry Date – The data of expiration of the identification document",
      "length": 10,
      isUse: true,
    },
    {
      "fieldID": "SURNAME-ENG",
      "description": "Surname (English) – Family name in English ",
      "length": 15,
      isUse: true,
      isUTF_16: true,
    },
    {
      "fieldID": "NAME-ENG",
      "description": "Given name (English) – First and middle name in English",
      "length": 40,
      isUse: true,
      isUTF_16: true,
    },
    {
      "fieldID": "SURNAME-CHI",
      "description": "Surname (Chinese) – Family name in Chinese",
      "length": 15,
      isUse: true,
      isUTF_16: true,
    },
    {
      "fieldID": "NAME-CHI",
      "description": "Given name (Chinese) -  First and middle name in Chinese",
      "length": 40,
      isUse: true,
      isUTF_16: true,
    },
    {
      "fieldID": "DAT-MOD-NAME",
      "description": "Date of the last modification of name",
      "length": 10,
      isUse: false,
    },
    {
      "fieldID": "REPRESEN",
      "description": "Legal Representative -  An individual legally bounded to represent a corporation",
      "length": 30,
      isUse: false,
      isUTF_16: true,
    },
    {
      "fieldID": "TITLE",
      "description": "Title – Salutation for the customer",
      "length": 1,
      isUse: true,
    },
    {
      "fieldID": "GENDER",
      "description": "Gender  - Gender of the customer",
      "length": 1,
      isUse: true,
    },
    {
      "fieldID": "MRST",
      "description": "Marital Status – Marital status of the customer",
      "length": 1,
      isUse: true,
    },
    {
      "fieldID": "DAT-MOD-MRST",
      "description": "Date of the last modification of marital status",
      "length": 10,
      isUse: false,
    },
    {
      "fieldID": "FORMER-NAME",
      "description": "Former Name  -  Former name",
      "length": 40,
      isUse: false,
      isUTF_16: true,
    },
    {
      "fieldID": "PLACE-BIRTH",
      "description": "Place of Birth – The country code where the customer is born",
      "length": 3,
      isUse: true,
    },
    {
      "fieldID": "DAT-BIRTH",
      "description": "Date of Birth – Birthday of the customer",
      "length": 10,
      isUse: true,
    },
    {
      "fieldID": "COD-NATIONALITY",
      "description": "Nationality Code – Nationality of the customer",
      "length": 3,
      isUse: false,
    },
    {
      "fieldID": "OFFICER",
      "description": "Domicile OIC - Branch Officer in charge in which the customer is first registered with.",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "FLG-OUT",
      "description": "Opt Out – Indicator to know whether the customer is willing to accept promotion materials",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "NCBA",
      "description": "Industry Code. Corporate table 0029. It is used for legal people or companies.",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-MOD-NCBA",
      "description": "Date of the last modification of industry code",
      "length": 10,
      isUse: false,
    },
    {
      "fieldID": "NCO",
      "description": "Occupation code (for natural persons). Corporate table 0035. Code for type of occupation performed by the employer",
      "length": 3,
      isUse: false,
    },
    {
      "fieldID": "PREFCHAN",
      "description": "Preferential Channel - The preferred channel used by the customer",
      "length": 2,
      isUse: false,
    },
    {
      "fieldID": "COD-LNG-SPEAK",
      "description": "Preferential Spoken Language - The preferred spoken language used by the customer for communication, e.g. English, Chinese",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "COD-LNG-WRITE",
      "description": "Preferential Written Language - The preferred written language used by the customer for communication, e.g. English, Chinese",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "TYP-CUSTOMER",
      "description": "Customer Type –  Indicates whether the record belongs to an individual  or a corporation",
      "length": 3,
      isUse: false,
    },
    {
      "fieldID": " CUS-STATUS",
      "description": "Customer Status – Customer describing the relationship with the bank. Indicates if the customer is a prospect, a real customer, or  a former customer. Updated on line when any modification, registration or deletion  on customer-account relationship is done.",
      "length": 2,
      isUse: false,
    },
    {
      "fieldID": "CUS-SEGMENT",
      "description":"Customer Segment – the defined segment in which the customer belongs to",
      "length": 2,
      isUse: false,
    },
    {
      "fieldID": "REGCHAN",
      "description": "Source Channel – Channel in which the customer is first registered",
      "length": 2,
      isUse: false,
    },
    {
      "fieldID": "BRN-REG",
      "description": "Domicile Branch – Branch in which the customer is first registered with.",
      "length": 4,
      isUse: false,
    },
    {
      "fieldID": "BONUS",
      "description": "Bonus – Indicate whether the bonus is offered to the customer.",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "CORP-PLAN",
      "description": "Corporate Plan – indicate the corporate plan in which the corporation is eligible for",
      "length": 15,
      isUse: false,
    },
    {
      "fieldID": "NUM-EMPLOYEE",
      "description": "Number of Employee – Number of employees in the corporation",
      "length": 10,
      isUse: false,
    },
    {
      "fieldID": "FLG-SUPP-DOC",
      "description": "Other IDs  Indicator – Indicate whether there are already other document Ids  than the main one for the customer",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "FLG-CONTACT-ALT",
      "description": "Alternative Contact Indicator – Indicate whether there are already other alternative contacts than primary contact for the customer",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "FLG-WARNING",
      "description": "Warning Indicator – Indicate whether there are warnings for the customer",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "FLG-CONFIDENTIAL",
      "description": "Confidential Data Indicator – Indicate whether there is already confidential information saved for the customer",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "DAT-CREATION",
      "description": "Creation Date – Basic information creation date YYYY-MM-DD",
      "length": 10,
      isUse: true,
    },
    {
      "fieldID": "USR-CREATION",
      "description": "Created By – Basic information creation party",
      "length": 8,
      isUse: true,
    },
    {
      "fieldID": "DAT-LASTMOD",
      "description": "Update Date – Basic information last update date YYYY-MM-DD-HH.MM.SS.#####",
      "length": 26,
      isUse: true,
    },
    {
      "fieldID": "USR-LASTMOD",
      "description": "Update By - Basic information last update user id",
      "length": 8,
      isUse: true,
    },
    {
      "fieldID": "ENT-LASTMOD",
      "description": "Update Entity",
      "length": 4,
      isUse: false,
    },
    {
      "fieldID": "BUS-EST",
      "description": "Business Establish",
      "length": 3,
      isUse: false,
    },
    {
      "fieldID": "HOME-ADDR-CTRY",
      "description": "Country of Home address",
      "length": 3,
      isUse: true,
    },
    {
      "fieldID": "CITIZEN-CTRY",
      "description": "Country of citizenship",
      "length": 3,
      isUse: true,
    },
    {
      "fieldID": "NCO-ISCO",
      "description":"Occupation Code (New)",
      "length": 4,
      isUse: false,
    },
    {
      "fieldID": "LONG-SURNAME-LNG1",
      "description": "Full Surname (ENG)",
      "length": 80,
      isUse: false,
      isUTF_16: true,
    },
    {
      "fieldID": "LONG-NAME-LNG1",
      "description":  "Full Given Name (ENG)",
      "length": 200,
      isUse: false,
      isUTF_16: true,
    },
    {
      "fieldID": "LONG-SURNAME-LNG2",
      "description": "Full Surname (CHI)",
      "length": 80,
      isUse: false,
      isUTF_16: true,
    },
    {
      "fieldID": "LONG-NAME-LNG2",
      "description": "Full Given Name (CHI)",
      "length": 200,
      isUse: false,
      isUTF_16: true,
    },
    {
      "fieldID": "DAT-MOD-LONG-NAME",
      "description": "Full Name Update Date",
      "length": 10,
      isUse: false,
    },
    {
      "fieldID": "LMOD-BRN-LONG-NAME",
      "description": "Full Name Update Center",
      "length": 4,
      isUse: false,
    },
    {
      "fieldID": "LMOD-USER-LONG-NAME",
      "description": "Full Name Update User",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-MOD-CTRY-NAT",
      "description":"Update Date of Nationality",
      "length": 10,
      isUse: false,
    },
    {
      "fieldID": "WMG-FLAG",
      "description": "Wealth Management Flag",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "BRN-LMOD-NCBA",
      "description": "Industry Code Last Update Centre",
      "length": 4,
      isUse: false,
    },
    {
      "fieldID": "USERLMOD-NCBA",
      "description": "Industry Code Last Update User",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "FILLER",
      "description": "Filler",
      "length": 155,
      isUse: false,
    }
  ]
}
const getPEFCHIR0FileMetaData = (): CORE2169FileMetaData[] => {
  return [
    {
      "fieldID": "COD-ENTITY",
      "description": "Entity – Entity in which the registration occurs",
      "length": 4,
      isUse: false,
    },
    {
      "fieldID": "NUM-CUS",
      "description": "Customer Internal Number – Internal sequential number given by the module to identify a unique customer",
      "length": 8,
      isUse: true,
    },
    {
      "fieldID": "TYP-CNTAADR",
      "description": "Contact Type - The classification of the contact information",
      "length": 2,
      isUse: true,
    },
    {
      "fieldID": "NUM-LADR1",
      "description": "Address Sequence",
      "length": 2,
      isUse: false,
    },
    {
      "fieldID": "FLG-LNG",
      "description": "Language Indicator – To identify whether the address is in English or Chinese",
      "length": 1,
      isUse: true,
    },
    {
      "fieldID": "EXT-ADR-LIN1",
      "description": "Address Line 1",
      "length": 40,
      isUse: true,
      isUTF_16: true,
    },
    {
      "fieldID": "EXT-ADR-LIN2",
      "description": "Address Line 2",
      "length": 40,
      isUse: true,
      isUTF_16: true,
    },
    {
      "fieldID": "EXT-ADR-LIN3",
      "description": "Address Line 3",
      "length": 40,
      isUse: true,
      isUTF_16: true,
    },
    {
      "fieldID": "EXT-ADR-LIN4",
      "description": "Address Line 4",
      "length": 40,
      isUse: true,
      isUTF_16: true,
    },
    {
      "fieldID": "EXT-ADR-LIN5",
      "description": "Address Line 5",
      "length": 40,
      isUse: true,
      isUTF_16: true,
    },
    {
      "fieldID": "ATT-NAME",
      "description": "Code Attn – the code for the recipient of the mail sent by the bank",
      "length": 30,
      isUse: false,
      isUTF_16: true,
    },
    {
      "fieldID": "CNTA-NAME",
      "description": "C/O – The corresponding person for the contact information",
      "length": 30,
      isUse: false,
      isUTF_16: true,
    },
    {
      "fieldID": "TYP-LOC",
      "description": "Flat Selection Box- Based on the values defined by the user for the location of the address; can be “Flat”, “Floor”, “Unit” and/or “Shop”",
      "length": 7,
      isUse: true,
    },
    {
      "fieldID": "LOC-DES",
      "description": "Flat Value – free text for the corresponding value of the Flat Selection Box",
      "length": 7,
      isUse: false,
      isUTF_16: true,
    },
    {
      "fieldID": "FLOOR-NUM",
      "description": "Floor - Part of the address. The floor number in which the customer live in",
      "length": 3,
      isUse: true,
    },
    {
      "fieldID": "BLOCK-NUM",
      "description": "Block - Part of the address. The block in which the customer live in",
      "length": 4,
      isUse: true,
    },
    {
      "fieldID": "BUIL-DES",
      "description": "Building/Estate - Part of the address. The name of the building in which the customer live in",
      "length": 20,
      isUse: false,
      isUTF_16: true,
    },
    {
      "fieldID": "STRE-TYP-FROM",
      "description": "Street (From) Selection Box – the beginning street number or code of the address",
      "length": 6,
      isUse: false,
    },
    {
      "fieldID": "STRE-COD-FROM",
      "description": "Street (From) Value – the corresponding value to the Street (from) Selection Box",
      "length": 5,
      isUse: false,
    },
    {
      "fieldID": "STRE-COD-TO",
      "description": "Street (To) Value - the corresponding value to the Street (To) Selection Box",
      "length": 5,
      isUse: false,
    },
    {
      "fieldID": "STRE-DESC",
      "description": "Street - Part of the address. The name of the street in which the customer live in",
      "length": 30,
      isUse: false,
      isUTF_16: true,
    },
    {
      "fieldID": "PHAS-DES",
      "description": "Phase Number Value – free text area of the corresponding value to Phase Number Selection Box",
      "length": 20,
      isUse: false,
      isUTF_16: true,
    },
    {
      "fieldID": "LOT-TYP",
      "description": "Lot Type – The type of lot in which the address falls into",
      "length": 10,
      isUse: false,
    },
    {
      "fieldID": "LOT-NUM",
      "description": "Lot Number – The number of the lot in which the address belongs to",
      "length": 5,
      isUse: false,
    },
    {
      "fieldID": "LOT-SECT",
      "description": "Lot Section – The section of the lot in which the address belongs to",
      "length": 5,
      isUse: false,
    },
    {
      "fieldID": "LOT-SUB-SECT",
      "description": "Lot Sub-section – the sub-section of the lot in which the address belongs to",
      "length": 5,
      isUse: false,
    },
    {
      "fieldID": "NUM-DD",
      "description": "DD Number – The DD number of the address",
      "length": 5,
      isUse: false,
    },
    {
      "fieldID": "ADD-REM-DES",
      "description": "Remark - Part of the address. Additional Address Information (e.g., Lot remark, sub-district, village, town)",
      "length": 40,
      isUse: false,
      isUTF_16: true,
    },
    {
      "fieldID": "COD-DIST",
      "description": "District code - The available districts code based on the entity selected",
      "length": 7,
      isUse: false,
    },
    {
      "fieldID": "COD-AREA",
      "description": "Area code - The district area code in which the address belongs to",
      "length": 2,
      isUse: false,
    },
    {
      "fieldID": "OVR-CTY-DESC",
      "description": "Oversea/china city description",
      "length": 10,
      isUse: false,
      isUTF_16: true,
    },
    {
      "fieldID": "OVR-PRV-DESC",
      "description": "Oversea province description",
      "length": 10,
      isUse: false,
      isUTF_16: true,
    },
    {
      "fieldID": "OVR-DIST-DESC",
      "description": "Oversea / china district",
      "length": 10,
      isUse: false,
      isUTF_16: true,
    },
    {
      "fieldID": "CODPOST",
      "description": "Postal Code – The box number/postal code of the address for mailing",
      "length": 10,
      isUse: false,
    },
    {
      "fieldID": "COD-CTRY",
      "description": "Country Code - The corresponding country code of the country",
      "length": 3,
      isUse: true,
    },
    {
      "fieldID": "COD-CTRY-PHONE",
      "description": "Country Telephone Code – The corresponding country code of the telephone number",
      "length": 3,
      isUse: true,
    },
    {
      "fieldID": "COD-AREA-PHONE",
      "description": "Area Telephone Code – The corresponding area code for the telephone number",
      "length": 3,
      isUse: true,
    },
    {
      "fieldID": "LNG-SPOKEN",
      "description": "Pref. Spoken Language – the language in which the customer would prefer to use",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "NUM-TPH",
      "description": "Tele / Fax - The telephone or facsimile number",
      "length": 20,
      isUse: true,
    },
    {
      "fieldID": "EMAIL-ADR",
      "description": "Email - The email address",
      "length": 30,
      isUse: true,
      isUTF_16: true,
    },
    {
      "fieldID": "REL-TYP-APP",
      "description": "Application Code – The code of the non-Alnova application. New Corporate Table",
      "length": 3,
      isUse: false,
    },
    {
      "fieldID": "REL-NUM-ACC-EXT",
      "description": "Non-Alnova account number",
      "length": 20,
      isUse: false,
    },
    {
      "fieldID": "REL-COD-ENTITY",
      "description": "Entity code",
      "length": 4,
      isUse: false,
    },
    {
      "fieldID": "REL-BRN-OPEN",
      "description": "Branch or center code; part of the account number",
      "length": 4,
      isUse: false,
    },
    {
      "fieldID": "REL-NUM-ACC",
      "description": "Account number",
      "length": 10,
      isUse: false,
    },
    {
      "fieldID": "REL-COD-MAIL",
      "description": "Mailing code for the account",
      "length": 2,
      isUse: false,
    },
    {
      "fieldID": "DAT-MOD-PRIM",
      "description": "Date of the last modification of primary address",
      "length": 10,
      isUse: false,
    },
    {
      "fieldID": "DAT-REG",
      "description": "Creation Date – Contact information creation Date(link Account is space)/Account-address linkage creation Date(link Account is not space)",
      "length": 10,
      isUse: true,
    },
    {
      "fieldID": "USR-REG",
      "description": "Create By – Contact information creation user(link Account is space)/Account-address linkage creation user(link Account is not space)",
      "length": 8,
      isUse: true,
    },
    {
      "fieldID": "DAT-LASTMOD",
      "description": "Update Date – Contact information last modified Date(link Account is space)/Account-address linkage last modified Date(link Account is not space)",
      "length": 26,
      isUse: true,
    },
    {
      "fieldID": "USRLASTMOD",
      "description": "Update By – Contact information last modified user(link Account is space)/Account-address linkage last modified user(link Account is not space)",
      "length": 8,
      isUse: true,
    },
    {
      "fieldID": "COD-CTRY-VAL",
      "description": "Country value ",
      "length": 3,
      isUse: false,
    },
    {
      "fieldID": "CV-CEN-LMOD",
      "description": "Country Value Last Update Centre",
      "length": 4,
      isUse: false,
    },
    {
      "fieldID": "CV-USR-LMOD",
      "description": "Country Value Last Update User",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "CV-TRM-LMOD",
      "description": "Country Value Last Update Terminal",
      "length": 4,
      isUse: false,
    },
    {
      "fieldID": "CV-STP-LMOD",
      "description": "Country Value Last Update Timestamp",
      "length": 26,
      isUse: false,
    },
    {
      "fieldID": "WMG-FLAG",
      "description": "WMG Flag",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "FILLER",
      "description": "FILLER",
      "length": 4,
      isUse: false,
    }
  ]
}
const getPEFCHI94FileMetaData = (): CORE2169FileMetaData[] => {
  return [
    {
      "fieldID": "DT-TYPE",
      "description": "Record Type ‘50’",
      "length": 2,
      isUse: false,
    },
    {
      "fieldID": "OP-CODE",
      "description": "Operation Code. A = New record, M =  Modification",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "NUM-CUS",
      "description": "Customer Internal ID – Internal sequential number given by the module to identify a unique customer",
      "length": 8,
      isUse: true,
    },
    {
      "fieldID": "COD-ENTITY",
      "description": "Entity – Entity in which the registration occurs. The scope of this phase will handle entity ‘0015’ only.Hardcode as ‘0015’ in this phase.",
      "length": 4,
      isUse: false,
    },
    {
      "fieldID": "COD-ID",
      "description": "Document Type",
      "length": 1,
      isUse: true,
    },
    {
      "fieldID": "KEY-ID",
      "description": "Document ID",
      "length": 25,
      isUse: true,
    },
    {
      "fieldID": "COD-ISS-CTRY",
      "description": "Document Issue Country",
      "length": 3,
      isUse: true,
    },
    {
      "fieldID": "COM-CODE",
      "description": "This Company Code is used to identify the company that the customer belongs to and handle multiple TIN existing in multiple companies such as:",
      "length": 2,
      isUse: false,
    },
    {
      "fieldID": "NAME-CUS",
      "description": "Customer Name – the derivation follows the rules in Opt-out project",
      "length": 40,
      isUse: true,
    },
    {
      "fieldID": "STATUS",
      "description": "The code and description will be defined in a new TC table. Refer to Appendix C.",
      "length": 3,
      isUse: true,
    },
    {
      "fieldID": "DAT-STATUS-LASTMOD",
      "description": "The last modification date of the Status field",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "PRE-EXIST-CUST",
      "description": "0 = No US Indicia changed, 1= With US Indicia changed, Blank = Non pre-exist customer as 31-12-2013",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "DAT-HV-CUST",
      "description": "High Value Customer As Of Date ",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-ENH-REVIEW",
      "description": "Enhanced Review Completion Date",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-RECAL",
      "description": "Recalcitrant Date",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "REMARKS",
      "description": "General remarks for any fields on the screen e.g. The reason for the recalcitrant account holder status, or remarks for the matched criteria or any other comments. Only English text is allowed to be input into this field.",
      "length": 200,
      isUse: false,
    },
    {
      "fieldID": "BRN-RESPON",
      "description": "The assigned responsible center code for users  to follow up with customers",
      "length": 4,
      isUse: false,
    },
    {
      "fieldID": "PARTY-RESPON",
      "description": "Can be RM code, staff ID etc ",
      "length": 9,
      isUse: false,
    },
    {
      "fieldID": "FLG-DIC",
      "description": "Indicia - US Document Issue Country,1= Checked,0 = Unchecked",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "FLG-NAT",
      "description": "Indicia - US Nationality",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "FLG-CITIZEN",
      "description": "Indicia – US Citizenship",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "FLG-POB-POO",
      "description": "Indicia - US POB / US Place of Origin",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "FLG-TEL-NO",
      "description": "Indicia – US Tel No",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "FLG-ADDR",
      "description": "Indicia - US Address/Home Address/Place of Operation",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "FLG-PASA",
      "description": "Indicia – PA/SA w/ US Address",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "FLG-SUO",
      "description": "Indicia – Substantial US Owner",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "FLG-TEL-NO-MLT",
      "description": "Indicia – US Tel No Multi-occur-flag, Y = occur more than once, otherwise ‘N’",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "FLG-US-ADDR-MLT",
      "description": "Indicia - US Address/Home Address/Place of Operation Multi-occur-flag",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "FLG-PASA-MLT",
      "description": "Indicia – PA/SA w/ US Address Multi-occur-flag",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "FLG-SUO-MLT",
      "description": "Indicia – Substantial US Owner Multi-occur-flag",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "FLG-SI-FUND",
      "description": "Indicia – SI Fund Tx to US A/C",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "FLG-ICHM",
      "description": "Indicia – Solely In Care of / Hold Mail Address",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "FLG-DOC-IC",
      "description": "Indicia - Document Incomplete",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "DAT-DIC-1ST-MAT",
      "description": "Indicia 1st Matched Date - US Document Issue Country",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-NAT-1ST-MAT",
      "description": "Indicia 1st Matched Date - US Nationality",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-CITIZEN-1ST-MAT",
      "description": "Indicia 1st Matched Date – US Citizenship",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-POB-POO-1ST-MAT",
      "description": "Indicia 1st Matched Date - US POB / US Place of Origin",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-TEL-NO-1ST-MAT",
      "description": "Indicia 1st Matched Date – US Tel No",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-ADDR-1ST-MAT",
      "description": "Indicia 1st Matched Date - US Address/Home Address/Place of Operation",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-PASA-1ST-MAT",
      "description": "Indicia 1st Matched Date – PA/SA w/ US Address",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-SUO-1ST-MAT",
      "description": "Indicia 1st Matched Date – Substantial US Owner  ",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-SI-FUND-1ST-MAT",
      "description": "Indicia 1st Matched Date – SI Fund Tx to US A/C",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-ICHM-1ST-MAT",
      "description": "Indicia 1st Matched Date – Solely In Care of / Hold Mail Address",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-DOC-IC-1ST-MAT",
      "description": "Indicia 1st Matched Date - Document Incomplete",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-DIC-LAST-MAT",
      "description": "Indicia Last Matched Date - US Document Issue Country",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-NAT-LAST-MAT",
      "description": "Indicia Last Matched Date - US Nationality",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-CITIZEN-LAST-MAT",
      "description": "Indicia Last Matched Date – US Citizenship",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-POB-POO-LAST-MAT",
      "description": "Indicia Last Matched Date - US POB / US Place of Origin",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-TEL-NO-LAST-MAT",
      "description": "Indicia Last Matched Date – US Tel No",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-ADDR-LAST-MAT",
      "description": "Indicia Last Matched Date - US Address/Home Address/Place of Operation",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-PASA-LAST-MAT",
      "description": "Indicia Last Matched Date – PA/SA w/ US Address",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-SUO-LAST-MAT",
      "description": "Indicia Last Matched Date – Substantial US Owner  ",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-SI-FUND-LAST-MAT",
      "description": "Indicia Last Matched Date – SI Fund Tx to US A/C",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-ICHM-LAST-MAT",
      "description": "Indicia Last Matched Date – Solely In Care of / Hold Mail Address  ",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-DOC-IC-LAST-MAT",
      "description": "Indicia Last Matched Date - Document Incomplete",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-DIC-COMP",
      "description": "Indicia Complete Date - US Document Issue Country",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-NAT-COMP",
      "description": "Indicia Complete Date - US Nationality",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-CITIZEN-COMP",
      "description": "Indicia Complete Date – US Citizenship",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-POB-POO-COMP",
      "description": "Indicia Complete Date - US POB / US Place of Origin",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-TEL-NO-COMP",
      "description": "Indicia Complete Date – US Tel No",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-ADDR-COMP",
      "description": "Indicia Complete Date - US Address/Home Address/Place of Operation",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-PASA-COMP",
      "description": "Indicia Complete Date – PA/SA w/ US Address",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-SUO-COMP",
      "description": "Indicia Complete Date – Substantial US Owner  ",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-SI-FUND-COMP",
      "description": "Indicia Complete Date – SI Fund Tx to US A/C",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-ICHM-COMP",
      "description": "Indicia Complete Date – Solely In Care of / Hold Mail Address ",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "DAT-DOC-IC-COMP",
      "description": "Complete Date for this Indicia",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "TAX-ID-SSN",
      "description": "Tax Identification No – SSN",
      "length": 15,
      isUse: false,
    },
    {
      "fieldID": "TAX-ID-EIN",
      "description": "Tax Identification No – EIN",
      "length": 15,
      isUse: false,
    },
    {
      "fieldID": "VERIFIED-GIIN",
      "description": "Verified GIIN",
      "length": 40,
      isUse: false,
    },
    {
      "fieldID": "IGA-CTRY",
      "description": "IGA Country",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "DAT-DOC-REQ",
      "description": "The date of request letter sent to target customers for the documentation",
      "length": 8,
      isUse: true,
    },
    {
      "fieldID": "DAT-DOC-EXPIRY",
      "description": "The expiry date of the documentation received from target customers e.g. Form W-8BEN",
      "length": 8,
      isUse: true,
    },
    {
      "fieldID": "DAT-REMED",
      "description": "This date should be inputted when all remediation work has been completed for the customer (including obtaining all cure documentation for US indicia, documentation for classifying entity types etc)",
      "length": 8,
      isUse: false,
    },
    {
      "fieldID": "USER-REG",
      "description": "Creation User",
      "length": 8,
      isUse: true,
    },
    {
      "fieldID": "DAT-REG",
      "description": "Creation Date",
      "length": 8,
      isUse: true,
    },
    {
      "fieldID": "BRN-REG",
      "description": "Creation Centre",
      "length": 4,
      isUse: false,
    },
    {
      "fieldID": "BRN-LASTMOD",
      "description": "Last Updated Centre",
      "length": 4,
      isUse: false,
    },
    {
      "fieldID": "USERLASTMOD",
      "description": "Last Updated User",
      "length": 8,
      isUse: true,
    },
    {
      "fieldID": "DATE-STP",
      "description": "Last Update Date & Time",
      "length": 26,
      isUse: true,
    },
    {
      "fieldID": "RECAL-CAT",
      "description": "Recalcitrant Category: 01: Passive NFFE 02 :US Person 03: Non Passive NFFE & Non US Person, with US Indicia 04: Non Passive NFFE without US Indicia. The description will be stored in a new TC reference table",
      "length": 2,
      isUse: false,
    },
    {
      "fieldID": "CONTACT-ID",
      "description": "Contact ID of the Regulatory Reference Address",
      "length": 3,
      isUse: false,
    },
    {
      "fieldID": "FLG-NEW-CC-ONLY-CUS",
      "description": "Credit-Card-Only Customer Flag",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "FLG-RPT-STATUS-CHG",
      "description": "Report Status Flag",
      "length": 1,
      isUse: false,
    },
    {
      "fieldID": "FILLER",
      "description": "FILLER",
      "length": 48,
      isUse: false,
    }
  ]
}