import fs from 'fs';
import csv from 'csv-parser';
import { AdminVehicleEntity } from "../entities";

interface CsvRow {
    [ key: string ]: string;
}

enum Marcas {
    MAC = "MAC",
    TUDOR = "TUDOR",
    VARTA = "VARTA",
}

export const parseAdminVehiclesCsv = ( filePath: string ): Promise<AdminVehicleEntity[]> => {
    return new Promise( ( resolve, reject ) => {
        const vehiclesEntities: AdminVehicleEntity[] = [];

        fs.createReadStream( filePath )
            .pipe( csv() )
            .on( 'data', ( row: CsvRow ) => {

                for ( const marca of Object.values( Marcas ) ) {

                    const rowBatteries: Set<string> = new Set();
                    getRowBatteries( marca, row ).forEach( battery => rowBatteries.add( battery ) );

                    const AdminBatteryEntity = rowMapper( marca, row, [ ...rowBatteries ] );
                    vehiclesEntities.push( AdminBatteryEntity );
                }

            } )
            .on( 'end', () => {
                resolve( vehiclesEntities );
            } )
            .on( 'error', ( error ) => {
                reject( error );
            } );
    } );

};

const getRowBatteries = ( marca: Marcas, row: CsvRow ): string[] => {

    const batteries: string[] = [];
    const brandKeys = Object.keys( row );
    let counter = 1;

    while ( brandKeys.includes( `${ marca }-${ counter }` ) ) {

        if ( !row[ `${ marca }-${ counter }` ] || row[ `${ marca }-${ counter }` ] === ' ' ) {
            counter++;
            continue;
        };

        batteries.push( row[ `${ marca }-${ counter }` ] );
        counter++;

    }

    return batteries;
};


const rowMapper = ( brand: string, row: CsvRow, rowBatteries: string[] ): AdminVehicleEntity => {
    if ( !brand ) throw new Error( "Falta brand" );
    if ( !rowBatteries ) throw new Error( "Faltan baterías" );
    if ( !row[ 'CATEGORIA' ] ) throw new Error( "Falta campo 'CATEGORIA' en CSV file" );
    if ( !row[ 'MARCA' ] ) throw new Error( "Falta campo 'MARCA' en CSV file" );
    if ( !row[ 'MODELO' ] ) throw new Error( "Falta campo 'MODELO' en CSV file" );
    if ( !row[ 'LINEA' ] ) throw new Error( "Falta campo 'LINEA' en CSV file" );

    return new AdminVehicleEntity(
        brand.trim(),
        row[ 'CATEGORIA' ].trim(),
        row[ 'MARCA' ].trim(),
        row[ 'MODELO' ].trim(),
        rowBatteries,
        undefined,
        row[ 'CILINDRAJE' ].trim(),
        row[ 'COMBUSTIBLE' ].trim(),
        row[ 'TECNOLOGIA' ].trim(),
        row[ 'POLARIDAD' ].trim(),
        row[ 'LINEA' ].trim(),
        row[ 'PERIODO' ].trim(),
    );
};
