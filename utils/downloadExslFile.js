const downloadExslFile = async (response) => {
  // console.log(response);
  try {
    const workbook = new ExcelJs.Workbook();
    const worksheet = workbook.addWorksheet("My Users");

    worksheet.columns = [
      { header: "name", key: "name", width: 10 },
      { header: "email", key: "email", width: 10 },
      { header: "university", key: "university", width: 10 },
      { header: "father_name", key: "father_name", width: 10 },
      { header: "mother_name", key: "mother_name", width: 10 },
      { header: "address", key: "address", width: 10 },
      { header: "gander", key: "gander", width: 10 },
      { header: "age", key: "age", width: 10 },
      { header: "mobile", key: "mobile", width: 10 },
      {
        header: "date",
        key: "date",
        width: 10,
      },
    ];

    response.forEach((user) => {
      worksheet.addRow(user);
    });
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    workbook.xlsx.writeFile("users.xlsx");
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
};

module.exports = downloadExslFile;
