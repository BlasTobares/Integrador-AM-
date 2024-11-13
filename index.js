const express = require("express");
const pug = require("pug");
const mysql = require("mysql2");

const app = express();

// Para manejar formularios con datos de tipo URL-encoded
app.use(express.urlencoded({ extended: true }));
// Para manejar solicitudes con datos en formato JSON (si es necesario)
app.use(express.json());

const conn = mysql.createConnection({
    port: 3306,
    host: 'localhost',
    user: 'root',
    password: '',        
    database: 'atenciónmedica'
})

app.set("view engine", "pug");
app.set("views", "views");

app.use(express.static("public"));

app.get("/medicos", (req, res) => {
    conn.query('SELECT * FROM medicos', (error, result) => {
        if(error){
            throw new Error('No se pudo consultar los medicos')
        }
        res.render("medicos/listar", { medicos: result });
    })
})

app.get("/medicos/pacientes", (req, res) => {
    const idMedico = req.query.id_medico;

    if (!idMedico) {
        return res.status(400).send("El ID del médico es requerido.");
    }

    conn.query(
        `SELECT pacientes.id_paciente, pacientes.nombre, pacientes.apellido, turnos.fecha, turnos.hora, turnos.motivo_consulta
         FROM pacientes
         JOIN turnos ON pacientes.id_paciente = turnos.id_paciente
         WHERE turnos.id_medico = ?`,
        [idMedico],
        (error, result) => {
            if (error) {
                console.error("Error en la consulta:", error);
                return res.status(500).send("No se pudo consultar los pacientes");
            }
            res.render("medicos/pacientes", { pacientes: result });
        }
    );
});

// Ruta para ver la historia clínica de un paciente
app.get("/medicos/historia", (req, res) => {
    const idPaciente = req.query.id_paciente; // Obtener el ID del paciente desde la URL

    if (!idPaciente) {
        return res.status(400).send("El ID del paciente es requerido.");
    }

    conn.query(
        'SELECT * FROM historiasclinicas WHERE id_paciente = ?',
        [idPaciente],
        (error, result) => {
            if (error) {
                console.error("Error al consultar la historia clínica:", error);
                return res.status(500).send("No se pudo consultar la historia clínica");
            }

            if (result.length === 0) {
                return res.send("No se encontró historia clínica para este paciente.");
            }

            // Pasar los datos de la historia clínica a la vista
            res.render("medicos/historia", { historiaClinica: result[0] });
        }
    );
});

// Ruta para cargar la evolución de un paciente
app.get("/medicos/cargarevolucion", (req, res) => {
    const idPaciente = req.query.id_paciente;

    if (!idPaciente) {
        return res.status(400).send("El ID del paciente es requerido.");
    }

    res.render("medicos/cargarEvolucion", { id_paciente: idPaciente });
});

// Ruta para guardar la evolución en la base de datos
app.post("/medicos/guardarEvolucion", (req, res) => {
    console.log(req.body);  // Agrega esta línea para ver los datos recibidos
    const { id_paciente, id_medico, fecha, contenido } = req.body;

    if (!id_paciente || !id_medico || !fecha || !contenido) {
        return res.status(400).send("Faltan datos en el formulario.");
    }

    // Insertar la evolución en la base de datos
    conn.query(
        'INSERT INTO evoluciones (id_turno, id_medico, fecha, contenido) VALUES (?, ?, ?, ?)',
        [id_paciente, id_medico, fecha, contenido],
        (error, result) => {
            if (error) {
                console.error("Error al guardar la evolución:", error);
                return res.status(500).send("No se pudo guardar la evolución.");
            }

            res.redirect(`/medicos/pacientes?id_medico=${id_medico}`);
        }
    );
});

app.get("/medicos/agenda", (req, res) => {
    const id_medico = req.query.id_medico; // Obtenemos el id_medico desde la URL

    if (!id_medico) {
        return res.status(400).send("No se proporcionó el ID del médico.");
    }

    const fechaHoy = new Date().toISOString().split('T')[0]; // Obtener la fecha de hoy (YYYY-MM-DD)

    // Consultar los turnos del médico para el día de hoy
    conn.query(
        `SELECT t.id_turno, t.fecha, t.hora, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido, t.motivo_consulta
        FROM turnos t
        JOIN pacientes p ON t.id_paciente = p.id_paciente
        WHERE t.id_medico = ? AND DATE(t.fecha) = ?`,
        [id_medico, fechaHoy],
        (error, result) => {
            if (error) {
                console.error("Error al consultar la agenda del médico:", error);
                return res.status(500).send("No se pudo consultar la agenda.");
            }

            // Enviar los resultados a la vista
            res.render("medicos/agenda", { turnos: result });
        }
    );
});

/*
app.get("/medicos/agenda", (req, res) => {
    const id_medico = req.query.id_medico; // Obtenemos el id_medico desde la URL

    if (!id_medico) {
        return res.status(400).send("No se proporcionó el ID del médico.");
    }

    const fechaHoy = new Date().toISOString().split('T')[0]; // Fecha actual en formato YYYY-MM-DD
console.log("Fecha de hoy: ", fechaHoy); // Verificar la fecha de hoy

conn.query(
    `SELECT t.id_turno, t.fecha, t.hora, p.nombre AS paciente_nombre, p.apellido AS paciente_apellido, t.motivo_consulta
    FROM turnos t
    JOIN pacientes p ON t.id_paciente = p.id_paciente
    WHERE t.id_medico = ? AND DATE(t.fecha) = ?`,
    [id_medico, fechaHoy],
    (error, result) => {
        if (error) {
            console.error("Error al consultar la agenda del médico:", error);
            return res.status(500).send("No se pudo consultar la agenda.");
        }

        console.log("Turnos encontrados:", result); // Ver los turnos encontrados
        res.render("medicos/agenda", { turnos: result });
    }
);
});
*/
/*app.post("/medicos/guardarEvolucion", (req, res) => {
    const { id_paciente, id_medico, fecha, contenido } = req.body;

    if (!id_paciente || !id_medico || !fecha || !contenido) {
        return res.status(400).send("Faltan datos en el formulario.");
    }

    // Insertar la evolución en la base de datos
    conn.query(
        'INSERT INTO evoluciones (id_turno, id_medico, fecha, contenido) VALUES (?, ?, ?, ?)',
        [id_paciente, id_medico, fecha, contenido],
        (error, result) => {
            if (error) {
                console.error("Error al guardar la evolución:", error);
                return res.status(500).send("No se pudo guardar la evolución.");
            }

            res.redirect(`/medicos/pacientes?id_medico=${id_medico}`);
        }
    );
});
*/
app.listen(3000, () => {
    console.log("Servidor corriendo en el puerto 3000");

})