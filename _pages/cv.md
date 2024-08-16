---
layout: archive
title: "CV"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---

{% include base_path %}

**My CV in PDF format is [here](../files/CV.pdf)**

Education
======
* B.S. in Computer Science and Engineering, Instituto Superior Técnico, 2022
* M.S. in Computer Science and Engineering, Instituto Superior Técnico, 2024 (expected)

Languages
======

Portugues - Native
English - B2
German - A1

Work experience
======

* Security Engineering @ Inspiring Solutions (01/01/2023 - Present)
  * My daily responsibilities involve:
    * Bridging the gap between the security-oriented solutions offered by our partners (IBM, Palo Alto, Checkpoint, etc...) and our customers.
    * Implementing those solutions in the clients
    * Providing client support for the implemented solutions by managing them
  * I assisted the Security and Network team at Banco de Investimento Global (BiG). This included managing the bank's:
    * Firewalls
    * Policies
    * Privilege and Non Privilege Accesses
    * Networks
    * SIEM

* Mentoring Program @ Instituto Superior Técnico (19/09/2020 - 30/6/2021)
  * This program focus on helping the IST's new students in everything they might need. Its a yearly program, which I participated for two years.
  * The program starts on the first day of classes, where I was tasked with giving a tour around the campus and helping them with enrolling in the university.
  * Then throughout the year, I'd be in charge of a group of 5 new students, which I'd help in anything they needed from simples things as where's the super market to sharing my classes' notes with them

Skills
======

* Programing: Python, C , C++, Java, C#, Prolog, Javascript, bash, powershell
* Ability to easily learn new information and tasks
* Teamwork
* Knowledge of Git
* Linux
* Windows
* Mac
* Computer Networks
* Distributed Systems
* Teaching
* BlockChain

{% assign all_skills = "" | split: "" %}  

{% for post in site.certifications %}
  {% for skill in post.skills %}
    {% assign all_skills = all_skills | push: skill %}
  {% endfor %}
{% endfor %}

{% assign unique_skills = all_skills | uniq %} 

{% for skill in unique_skills %}

* {{ skill }}
{% endfor %}


Publications
======
  <ul>{% for post in site.publications reversed %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul>
  
  
Teaching
======
  <ul>{% for post in site.teaching reversed %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul>

Awards
======
  <ul>{% for post in site.awards reversed %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul>

Certifications
======
  <ul>{% for post in site.certifications reversed %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul>
