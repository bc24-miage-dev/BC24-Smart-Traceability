# Formal verification of resources consistency

this script does the following things:

- convert the ts resources in json
- load the json file in a directed graph
- check that the directed graph has no cycle
- check that there's always a path from any node to the origin node
