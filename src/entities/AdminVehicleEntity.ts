export class AdminVehicleEntity {
    constructor (
        public readonly brand: string,
        public readonly type: string,
        public readonly makes: string,
        public readonly model: string,
        public readonly batteries: string[],
        public readonly bodywork?: string,
        public readonly cylinder?: string,
        public readonly gasType?: string,
        public readonly technology?: string,
        public readonly polarity?: string,
        public readonly version?: string,
        public readonly year?: string,
    ) { }
}
