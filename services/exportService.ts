import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { EpisodeOutline } from "../types";

export const generateOutlineDocx = async (outline: EpisodeOutline[], novelName: string): Promise<Blob> => {
  const children: Paragraph[] = [];

  // Title Page
  children.push(
    new Paragraph({
      text: `${novelName} - 短剧分集大纲`,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
    new Paragraph({
      text: `总集数：${outline.length} 集`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    })
  );

  // Episodes
  outline.forEach((ep) => {
    children.push(
      new Paragraph({
        text: `第 ${ep.episodeNumber} 集：${ep.title}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "剧情梗概：",
            bold: true,
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: ep.synopsis,
        spacing: { after: 300 },
        alignment: AlignmentType.JUSTIFIED,
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  return await Packer.toBlob(doc);
};