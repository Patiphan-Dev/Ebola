google.charts.load("current", {
  packages: ["corechart", "bar"],
});
google.charts.setOnLoadCallback(loadTable);

function loadTable() {
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "http://localhost:3000/ebola");
  xhttp.send();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        var trHTML = "";
        var num = 1;
        const objects = JSON.parse(this.responseText);
        for (let object of objects) {
          trHTML += "<tr>";
          trHTML += "<td>" + num + "</td>";
          trHTML += "<td>" + object["Country"] + "</td>";
          trHTML += "<td>" + object["Date"] + "</td>"; // Date is already formatted in backend
          trHTML += "<td>" + object["ConfirmedCases"] + "</td>";
          trHTML += "<td>" + object["ConfirmedDeaths"] + "</td>";
          trHTML += "<td>";
          trHTML +=
            '<a type="button" class="btn btn-outline-warning mx-1" onclick="showEbolaEditBox(\'' +
            object["_id"] +
            '\')"><i class="fas fa-edit"></i></a>';
          trHTML +=
            '<a type="button" class="btn btn-outline-danger mx-1" onclick="EbolaDelete(\'' +
            object["_id"] +
            '\')"><i class="fas fa-trash"></i></a></td>';
          trHTML += "</tr>";

          num++;
        }
        document.getElementById("mytable").innerHTML = trHTML;

        loadGraph(); // Load graph function after table is populated
      } else {
        console.error("Error fetching data:", this.statusText);
        document.getElementById("mytable").innerHTML =
          '<tr><td colspan="6">Error fetching data. Please try again later.</td></tr>';
      }
    }
  };
}

function loadQueryTable() {
  // แสดงข้อความ Loading
  document.getElementById("mytable").innerHTML =
    '<tr><th scope="row" colspan="5">Loading...</th></tr>';
  const searchText = document.getElementById("searchTextBox").value;

  // ตรวจสอบว่ามีข้อความค้นหาหรือไม่
  if (!searchText) {
    Swal.fire("Please enter a search term.");
    return;
  }

  const xhttp = new XMLHttpRequest();
  xhttp.open(
    "GET",
    "http://localhost:3000/ebola/country/" + encodeURIComponent(searchText)
  );

  xhttp.send();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        var trHTML = "";
        var num = 1;
        const objects = JSON.parse(this.responseText).Ebola;

        // เช็คว่ามีข้อมูลหรือไม่
        if (objects && objects.length > 0) {
          for (let object of objects) {
            trHTML += "<tr>";
            trHTML += "<td>" + num + "</td>";
            trHTML += "<td>" + object["Country"] + "</td>";
            trHTML += "<td>" + object["Date"].split("T")[0] + "</td>"; // เอาวันที่โดยไม่รวมเวลาที่ไม่ต้องการ
            trHTML +=
              "<td>" +
              (object["Cumulative no"][" of confirmed, probable and suspected cases"] || "N/A") +
              "</td>"; // ข้อมูลจำนวนเคส
            trHTML +=
              "<td>" +
              (object["Cumulative no"][" of confirmed, probable and suspected deaths"] || "N/A") +
              "</td>"; // ข้อมูลจำนวนผู้เสียชีวิต
            trHTML += "<td>";
            trHTML +=
              '<a type="button" class="btn btn-outline-warning mx-1" onclick="showEbolaEditBox(\'' +
              object["_id"] +
              '\')"><i class="fas fa-edit"></i></a>';
            trHTML +=
              '<a type="button" class="btn btn-outline-danger mx-1" onclick="EbolaDelete(\'' +
              object["_id"] +
              '\')"><i class="fas fa-trash"></i></a>';
            trHTML += "</td>";
            trHTML += "</tr>";
            num++;
          }
        } else {
          // แสดงข้อความเมื่อไม่มีข้อมูล
          trHTML = '<tr><td colspan="6">No results found.</td></tr>';
        }
        console.log(trHTML);
        document.getElementById("mytable").innerHTML = trHTML;
      } else {
        console.error("Error fetching data:", this.statusText);
        Swal.fire(
          "Oops!",
          "Something went wrong while fetching results.",
          "error"
        );
        document.getElementById("mytable").innerHTML =
          '<tr><td colspan="6">Error fetching data. Please try again later.</td></tr>';
      }
    }
  };
}

//สร้างกราฟ
function loadGraph() {
  let Infected = 0;
  let Death = 0;

  const InfectedCounts = {};
  const DeathCounts = {};

  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "http://localhost:3000/ebola/", true);
  xhttp.onreadystatechange = function () {
    if (this.readyState === 4) {
      if (this.status === 200) {
        const objects = JSON.parse(this.responseText);

        console.log(objects);
        // นับจำนวนผู้ติดเชื้อและเสียชีวิต
        objects.forEach(object => {
          Infected += parseInt(object.ConfirmedCases) || 0;
          Death += parseInt(object.ConfirmedDeaths) || 0;
        });

        // แสดงกราฟวงกลมสำหรับ Infected และ Death
        const TimelyResponseData = google.visualization.arrayToDataTable([
          ["Status", "Count"],
          ["Infected", Infected],
          ["Death", Death],
        ]);

        const optionsTimelyResponse = {
          title: "Infected vs Death Stats (Total Counts)",
        };

        const chartTimelyResponse = new google.visualization.PieChart(
          document.getElementById("piechartTimelyResponse")
        );
        chartTimelyResponse.draw(TimelyResponseData, optionsTimelyResponse);

        // นับจำนวนผู้ติดเชื้อและเสียชีวิตตามประเทศ
        objects.forEach(object => {
          const country = object.Country || "Unknown"; // ตั้งชื่อประเทศเป็น Unknown หากไม่พบ
          const infected = parseInt(object.ConfirmedCases) || 0;
          const death = parseInt(object.ConfirmedDeaths) || 0;

          InfectedCounts[country] = (InfectedCounts[country] || 0) + infected;
          DeathCounts[country] = (DeathCounts[country] || 0) + death;
        });

        // จัดอันดับประเทศตามจำนวนผู้ติดเชื้อ
        const sortedCountries = Object.entries(InfectedCounts).sort((a, b) => b[1] - a[1]);

        // แสดงเฉพาะ Liberia, Guinea และ Other
        let Liberia = 0;
        let Guinea = 0;
        let OtherInfected = 0;
        let OtherDeath = 0;

        sortedCountries.forEach(([country, count], index) => {
          if (index === 0) {
            Liberia = count; // ประเทศแรกคือ Liberia
          } else if (index === 1) {
            Guinea = count; // ประเทศที่สองคือ Guinea
          } else {
            OtherInfected += count; // รวมประเทศอื่น ๆ ไว้ใน Other
            OtherDeath += DeathCounts[country] || 0; // รวมจำนวนผู้เสียชีวิตใน Other
          }
        });

        // สร้างข้อมูลกราฟ
        const barChartData = [
          ["Country", "Infected", "Death"],
          ["Liberia", Liberia, DeathCounts["Liberia"] || 0],
          ["Guinea", Guinea, DeathCounts["Guinea"] || 0],
          ["Other", OtherInfected, OtherDeath],
        ];

        // แสดง BarChart
        const data = google.visualization.arrayToDataTable(barChartData);

        const options = {
          title: "Infected and Death Stats by Country",
          hAxis: { title: "Country" },
          vAxis: { title: "Count" },
          isStacked: true,
        };

        const chart = new google.visualization.BarChart(
          document.getElementById("barchartSubmitted")
        );
        chart.draw(data, options);
      } else {
        console.error("Error fetching data:", this.statusText);
        Swal.fire(
          "Oops!",
          "Something went wrong while fetching the graph data.",
          "error"
        );
      }
    }
  };
  xhttp.send();
}


function showEbolaCreateBox() {
  var d = new Date();
  const date = d.toISOString().split("T")[0]; // Default today's date

  Swal.fire({
    title: "Create Patient Information",
    html:
      '<div class="mb-3"><label for="Country" class="form-label">Country</label>' +
      '<input class="form-control" id="Country" placeholder="Country"></div>' +
      '<div class="mb-3"><label for="Date" class="form-label">Date</label>' +
      `<input class="form-control" type="date" id="Date" placeholder="2024-01-30" value="${date}"></div>` + // Pre-fill with today's date
      '<div class="mb-3"><label for="Infected" class="form-label">Cumulative no. of confirmed, probable and suspected cases</label>' +
      '<input class="form-control" id="Infected" type="number" placeholder="9999"></div>' +
      '<div class="mb-3"><label for="Death" class="form-label">Cumulative no. of confirmed, probable and suspected deaths</label>' +
      '<input class="form-control" id="Death" type="number" placeholder="9999"></div>',
    focusConfirm: false,
    preConfirm: () => {
      // Call the function to create the patient record with the input data
      EbolaCreate();
    },
  });
}

function EbolaCreate() {
  const country = document.getElementById("Country").value;
  const date = document.getElementById("Date").value;
  const infected = document.getElementById("Infected").value;
  const death = document.getElementById("Death").value;

  // Validate input fields
  if (!country || !date || !infected || !death) {
    Swal.fire("Error", "All fields are required.", "error");
    return;
  }

  const newPatient = {
    Country: country,
    Date: date,
    Infected: parseInt(infected) || null, // ปรับปรุงให้ใช้ค่า infected ตรง ๆ
    Death: parseInt(death) || null, // ปรับปรุงให้ใช้ค่า death ตรง ๆ
  };

  // Debugging: log the newPatient object before sending
  console.log("Sending object:", newPatient);

  // Send the data to the backend via POST request
  const xhttp = new XMLHttpRequest();
  xhttp.open("POST", "http://localhost:3000/ebola/create", true);
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhttp.send(JSON.stringify(newPatient));

  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      Swal.fire("Success", "Patient record created successfully.", "success");
      loadTable(); // Refresh the table to display the new data
    } else if (this.readyState == 4) {
      Swal.fire("Error", "Failed to create patient record.", "error");
    }
  };
}

function EbolaDelete(id) {
  if (!id) {
    console.error("Invalid ID");
    return;
  }

  console.log("Delete: ", id);

  fetch("http://localhost:3000/ebola/delete", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
    },
    body: JSON.stringify({ _id: id }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      Swal.fire("Good job!", "Delete ebola Successfully!", "success");
      loadTable();
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
      Swal.fire("Error!", "Failed to delete ebola.", "error");
    });
}

function showEbolaEditBox(id) {
  console.log("edit", id);
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "http://localhost:3000/ebola/" + id);
  xhttp.send();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      const object = JSON.parse(this.responseText).object;
      console.log("showEbolaEditBox", object);

      // Ensure that Date is properly formatted
      const formattedDate = new Date(object["Date"])
        .toISOString()
        .split("T")[0];

      // Build the form using the object data
      Swal.fire({
        title: "Edit Patient Information",
        html:
          '<input id="id" class="swal2-input" type="hidden" value="' +
          object["_id"] +
          '">' +
          '<div class="mb-3"><label for="Country" class="form-label">Country</label>' +
          '<input class="form-control" id="Country" placeholder="Country" value="' +
          object["Country"] +
          '"></div>' +
          '<div class="mb-3"><label for="Date" class="form-label">Date</label>' +
          '<input class="form-control" type="date" id="Date" placeholder="2024-01-30" value="' +
          formattedDate +
          '"></div>' +
          '<div class="mb-3"><label for="Infected" class="form-label">Cumulative no. of confirmed, probable and suspected cases</label>' +
          '<input class="form-control" id="Infected" placeholder="9999.9" value="' +
          object["Cumulative no"][
            " of confirmed, probable and suspected cases"
          ] +
          '"></div>' +
          '<div class="mb-3"><label for="Death" class="form-label">Cumulative no. of confirmed, probable and suspected deaths</label>' +
          '<input class="form-control" id="Death" placeholder="9999.9" value="' +
          object["Cumulative no"][
            " of confirmed, probable and suspected deaths"
          ] +
          '"></div>',
        focusConfirm: false,
        preConfirm: () => {
          return EbolaEdit(); // Return the EbolaEdit function
        },
      });
    }
  };
}

async function EbolaEdit() {
  const id = document.getElementById("id").value;
  const Country = document.getElementById("Country").value;
  const Date = document.getElementById("Date").value;
  const Infected = document.getElementById("Infected").value;
  const Death = document.getElementById("Death").value;

    // Validate input fields
    if (!Country || !Date || !Infected || !Death) {
      Swal.fire("Error", "All fields are required.", "error");
      return;
    }
  
    const newPatient = {
      Country: Country,
      Date: Date,
      Infected: parseInt(Infected) || null, // ปรับปรุงให้ใช้ค่า infected ตรง ๆ
      Death: parseInt(Death) || null, // ปรับปรุงให้ใช้ค่า death ตรง ๆ
    };

  const data = {
    _id: id,
    Country: Country,
    Date: Date,
    Infected: parseInt(Infected) || null, // ปรับปรุงให้ใช้ค่า Infected ตรง ๆ
    Death: parseInt(Death) || null, // ปรับปรุงให้ใช้ค่า Death ตรง ๆ
  };

  console.log(JSON.stringify(data));

  try {
    const response = await fetch("http://localhost:3000/ebola/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const objects = await response.json();
    Swal.fire("Good job!", "Update ebola Successfully!", "success");
    loadTable(); // รีเฟรชตารางหลังจากอัปเดตสำเร็จ
  } catch (error) {
    console.error("Error updating ebola:", error);
    Swal.fire("Oops!", "Something went wrong!", "error");
  }
}
