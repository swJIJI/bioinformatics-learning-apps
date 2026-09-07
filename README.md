# Bioinformatics (BI) Analysis Lab

Three interactive browser apps that walk researchers step by step through
genomic data analysis workflows — built conversationally with Claude and
shared with colleagues in my laboratory.

## Why

I spent ten years in a wet lab before moving into computational analysis.
These apps grew out of that transition. The goal is to help researchers
become familiar with the vocabulary of each analysis and to build an
intuition for how the steps connect — not to produce publication-grade
results.

Each step pairs the core concept with an everyday analogy and exposes the
actual parameters a researcher would set. The apps call the Claude API
directly: pressing "generate guide" sends the user's current parameter
settings to Claude, which returns a three-layer explanation — concept,
annotated code, and interpretation — tailored to those settings rather than
a fixed block of text.

**The interface is in Korean**, since the intended users are wet-lab
researchers in Korean laboratories.

## The apps

### scRNA-seq Lab
Six steps through the standard single-cell workflow: quality control,
normalization, dimensionality reduction (PCA → UMAP / t-SNE), clustering,
cell type annotation, and differential expression.

<img width="1180" height="1297" alt="scrnaseq" src="https://github.com/user-attachments/assets/14447c45-31f5-4c65-ad6a-3a80e4c8c0b1" />


### Bulk RNA-seq Lab
Six steps covering the DESeq2 and edgeR pipelines, with a toggle to follow
either tool or compare the two side by side: data import, sample-level QC,
normalization, differential expression, visualization (volcano, MA, heatmap),
and pathway analysis (GO / KEGG / GSEA).

<img width="1194" height="1291" alt="bulkrnaseq" src="https://github.com/user-attachments/assets/3e33638b-b7f9-49db-b6be-d9fc32975f59" />


### WES Analysis Lab
A seven-step roadmap written for complete beginners, opening with a plain-
language Q&A on what an exome is and why we sequence it, then moving through
FASTQ files, quality control, alignment, variant calling, annotation, and
clinical interpretation (driver variants, TMB, mutational signatures).

<img width="1179" height="1295" alt="wes" src="https://github.com/user-attachments/assets/3d6fe368-5db2-42fe-9523-3bfd3754750a" />


## Note

Teaching aids, not validated analysis software. Parameters and outputs are
illustrative.

## Author

Ji Hye Jeong, Ph.D.
Asan Institute for Life Sciences, Asan Medical Center, Seoul, Republic of Korea
