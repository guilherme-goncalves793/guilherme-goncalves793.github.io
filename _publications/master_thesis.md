---
title: "Master Thesis"
collection: publications
category: thesis
permalink: /publication/master_thesis
date: 2024-11-12
paperurl: 'https://guilherme-goncalves793.github.io/files/master_thesis.pdf'
slidesurl: 'https://guilherme-goncalves793.github.io/files/dissertation.pptx'
---

Abstract
======
  In our increasingly digital world, the need for secure web applications is crucial, especially with the
  growing use of JavaScript and Node.js [1] in web development. Despite its advantages, Node.js faces
  significant security challenges, largely due to vulnerabilities introduced through its dynamic nature and the
  Node Package Manager (NPM) [2]. To address these issues, we enhance the Graph.js [3] vulnerability
  detection tool, which has proven effective but is limited by its lack of support for inter-procedural and
  multi-file analysis, resulting in false positives.
  To address those limitations, we propose modifications to Graph.js by developing an Extended Multi-
  version Dependency Graph (EMDG) that improves inter-procedural analysis and unifies graphs from
  various modules. Additionally, we introduce three new detection algorithms: the Top-Down, Bottom-Up
  with Pre-processing, and Bottom-Up Greedy algorithms, each designed to effectively identify vulnerabili-
  ties. Besides the algorithms, we also propose a new definition for an attacker-controlled object, aiming to
  detect vulnerabilities that the tool did not report.
  We evaluated our new approaches in two ground truth datasets, the VulcaN [4] and SecBench [5]. The
  evaluation demonstrates that the Bottom-Up Greedy approach achieves an 82% recall and 85% precision,
  outperforming the original Graph.js and ODGen [6] by reducing false positives. Furthermore, testing on a
  dataset of real-world NPM packages reveals that the Bottom-Up Greedy approach reports 83% fewer
  vulnerabilities and is 3 seconds faster on average than the current version of Graph.js. Precision and
  recall for this dataset are estimated at 83% and 81%, respectively.Notably, with the new attacker-controlled
  object definition, the number of vulnerabilities reported increases by 30%, yet the estimated precision
  remains the same.

[Download Papper](../files/master_thesis.pdf)
[Download Extended Abstract](../files/master_thesis_extended_abstract.pdf)
[Download Slides](../files/dissertation.pptx)
