export type SvgRasterizer = (svg: string) => Promise<Uint8Array>;

export class PngExporter {
  private readonly rasterize: SvgRasterizer;
  constructor(rasterize: SvgRasterizer) { this.rasterize = rasterize; }
  async export(svg: string): Promise<Uint8Array> {
    if (!svg.trimStart().startsWith('<svg')) throw new Error('Entrada SVG inválida');
    const bytes = await this.rasterize(svg);
    const signature = [137,80,78,71,13,10,26,10];
    if (bytes.length < 8 || signature.some((v, i) => bytes[i] !== v)) throw new Error('Rasterizador não retornou PNG válido');
    return bytes;
  }
}
