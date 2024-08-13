---
title: 'Masters Projects'
interval:
  start_date: "2019-09-15"
  end_date: "2022-07-15"
permalink: /academic/masters/
---

> In here you will find a summary of all the projects that I have worked on during my masters in Computer Science and Engineering, with major in Distributed Systems and Cyber Security. The subjects listed here reflect the choices I made.

## 1st Year

### 1st semester (2022/2023)

#### Forensic Cyber-Security

- Criminal Investigation divided inot three parts, with the sole purpose of giving us hands on experience on common forensic tools.
- 1st part:  
  
  - Focused on Steganography and Watermarking Tecniques. Basically, how to find and extract files/messages that were hidden using these tecniques.

- 2nd part:

  - Focused on file system and volume analysis, resorting mostly to The Sleuth Kit tool.

- 3rd part:

  - Focused on network traffic analysis. For this part, mostly Wireshark was used.

#### Design and Implementation of Distributed Aplications

- language -> c# (.dotnet core framework)
- We were tasked with the implementation of a bank app that offered strong consistency and fautl tolerance. Strong consistency is garanteed through the use of Two Phase commit for request processing, by the bank servers. To ensure fault tolerance, the bank servers will rely on an external coodination service for the leader election. The coordination service runs the Paxos algorithm for solving the consensus problem that we faced. Note that we implemented both the bank server and the coordination service.

- Notes:
  - If interested, there is a project description and a papper like report that fully explain both the problem and the solution. I can make it available, just contact me.

#### Computer and Network Security

- language -> Java + Postgresql + NodeJs
- Design and implement a distributed system (frontend + backend) ensuring the not only database and communication security, but also 2-factor authentication

#### Software Security

- Lab assignments gave us hands on experience with exploiting vulnerabilities
- Project:
  - Static analysis tool to search for vulnerabilities in php code. Employing a source, sink, sanitizers integrity policy
  
### 2nd semester (2022/2023)

#### Parallel and Distributed Computing

- language -> C++
- Optimizing the travelling sales problem using parallel and distributed programming. More specifically, we used openMP and MPI. To reduce the search tree, we also used the branch and bound algorithm.
  
#### Highly Dependable Systems

- language -> Java
- Project divided into two parts.
- 1st part:
  - Develop a simplified version of a permissioned blockchain, using QBFT, aka Istanbul BFT Consensus.
- 2nd part:
  - Extend the 1st part to support token transfer transactions and smart contracts. For this, we developed a replicated state machine that supports the system in question.

#### Autonomous Agents and Multi-Agent Systems

- language -> Python
- Develop a multi-agent system where the agents have to face coordination problems. Then, evaluate how the agents behave in different scenarios, to find the best type of agent. In this case, the coordination problem was putting out fires.

#### Mobile and Ubiquitous Computing

- language -> Java (Android)
- Develop an android app that allows users to share books. The app should allow users to search for books, add books to their library, and request books from other users.

#### Security and Management of Information Systems

- There was no project. We started by analyzing cases based on given themes (the themes were Business Management, IT Management, IT Infrastructures, Operations and Projects and IT Strategy). Then, we had to do a group work where we analyzed the theme National and Critical Infrastructures, how they are managed, how they are protected and what are the main challenges.

#### Comunication Skills in Computer Science and Engineering

- Practice and improve communication skills, both personal and professional (for example, for job interviews).

## 2nd Year

### 1st semester (2023/2024)

#### Algorithms for Computational Logic

- language -> python
- Developed a python tool that solves the Automatic Ruleset problem. There are two versions of the tools, one uses a SAT solver and the other uses a SMT solver.

#### Network Science

- language -> c++ using the boost library for the graph representation
- Implement and compare the performance of two different algorithms used to find k-cores in graphs.

#### Business Process Engineering and Technology

- Analysis of a business process and development of a business process model. Subsequently, we had to propose improvements for the respective business process.
  
#### 2nd Cycle Integrated Project in Computer Science and Engineering

- Development of the master thesis proposal which can be found [here](./publications/Detecting_Multi_file_Vulnerabilities_Using_Code_Property_Graphs.pdf)

### 2nd semester (2023/2024)

#### Master Thesis

- Currently working on it. The topic is **Detecting Multi-file vulnerabiilities using Code Property Graphs**
