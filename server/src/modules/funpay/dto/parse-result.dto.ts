export class ParseResultDto {
  success: boolean;
  parsed: number;
  new: number;
  updated: number;
  deactivated: number;
  errors?: string[];
}
