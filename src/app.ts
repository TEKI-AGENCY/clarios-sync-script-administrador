import path from "path";
import {
    parseAdminVehiclesCsv,
    prisma,
} from "./lib";

const main = async () => {

    const VEHICLES_PATH = path.resolve( __dirname, `./${ process.env.VEHICLES_PATH }` );
    const TRANSACTION_TIMEOUT_SECONDS = 60 * 20;

    // Crear transaction
    await prisma.$transaction( async ( tx ) => {
        console.log( "COMIENZA TRANSACCIÓN" );
        try {

            const missingBatteriesReferences = [];

            console.log( "Truncate admin tables" );
            await tx.catalog_mac_vehicle.deleteMany();
            await tx.mac_vehicles.deleteMany();

            console.log( "Load CSV admin vehicles from admin-vehicles.csv" );
            const vehiclesEntities = await parseAdminVehiclesCsv( VEHICLES_PATH );

            console.log( "Start generating vehicles and relationships" );

            let vehiclesCount = 0;
            for ( const vehicleEntity of vehiclesEntities ) {

                // Skip if vehicle has no batteries assigned
                if ( !vehicleEntity.batteries.length ) {
                    continue;
                }

                const adminVehicleDB = await tx.mac_vehicles.create( {
                    data: {
                        brand: vehicleEntity.brand,
                        makes: vehicleEntity.makes,
                        model: vehicleEntity.model,
                        type: vehicleEntity.type,
                        bodywork: vehicleEntity.bodywork,
                        cylinder: vehicleEntity.cylinder,
                        gas_type: vehicleEntity.gasType,
                        polarity: vehicleEntity.polarity,
                        technology: vehicleEntity.technology,
                        version: vehicleEntity.version,
                        year: vehicleEntity.year,
                        created_at: new Date(),
                        updated_at: new Date(),
                    }
                } );

                vehiclesCount++;
                console.log( `${ vehicleEntity.brand } vehicle created --------- TOTAL VEHICLES CREATED: ${ vehiclesCount }` );

                for ( const battery of vehicleEntity.batteries ) {

                    // Check if there's a battery
                    if ( !battery ) {
                        continue;
                    }

                    const catalog = await tx.catalogs.findFirst( { where: { reference: battery } } );

                    // Check if the battery exists
                    if ( !catalog ) {
                        missingBatteriesReferences.push( battery );
                        continue;
                    }

                    await tx.catalog_mac_vehicle.create( {
                        data: {
                            catalog_id: catalog.id,
                            mac_vehicle_id: adminVehicleDB.id,
                            priority: vehicleEntity.batteries.indexOf( battery ) + 1,
                            recommended: vehicleEntity.batteries[ 0 ] === battery,
                            created_at: new Date(),
                            updated_at: new Date(),
                        }
                    } );
                    console.log( "Relationship created ********" );
                }
            }

            console.log( "ACTUALIZACIÓN DE VEHÍCULOS Y BATERÍAS EXITOSA\n" );
            console.log( "1. Verifique los cambios en producción, si se detecta alguna inconsistencia revierta los cambios inmediatamente.\n" );
            console.log( "BATERÍAS POR CREAR EN EL SISTEMA" );
            console.log( missingBatteriesReferences );

        } catch ( error ) {
            console.log( error );
            console.log( "\nERROR EN LA ACTUALIZACIÓN\n" );
            console.log( "1. Revierta los cambios en las BD de producción del administrador Clarios." );
            console.log( "2. Levante un ambiente de pruebas para depurar el error.\nNo olvide cambiar la cadena de conexión en las variables de entorno para apuntar a la BD de pruebas." );
        }

    }, {
        timeout: TRANSACTION_TIMEOUT_SECONDS * 1000, // default: 5000
    } );

};

main();
