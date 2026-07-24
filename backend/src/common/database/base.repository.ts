export abstract class BaseRepository {
    protected constructor(
        protected readonly accountId: string
    ) {}
}