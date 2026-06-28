document.getElementById("uploadBtn").addEventListener("click", leerExcel);

function leerExcel() {

    const archivo =
        document.getElementById("excelFile").files[0];

    if (!archivo) {

        alert("Selecciona un Excel");

        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {

        const data = new Uint8Array(e.target.result);

        const workbook = XLSX.read(data, {
            type: "array"
        });

        const hoja =
            workbook.Sheets[workbook.SheetNames[0]];

        const filas =
            XLSX.utils.sheet_to_json(hoja, {
                header: 1
            });

        console.log(filas);

        alert(
            "Excel leído correctamente. Revisa la consola."
        );
    };

    reader.readAsArrayBuffer(archivo);
}