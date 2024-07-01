import json
import networkx as nx
import matplotlib.pyplot as plt
import sys
from networkx.drawing.nx_agraph import graphviz_layout

with open("output.json", "r") as f:
    template = f.read()
template = json.loads(template)

G = nx.DiGraph()
for res in template:
    if not res["needed_resources"]:
        G.add_edge(res["ressource_id"], "manufacturable")
    for produce in res["produces_resources"]:
        G.add_edge(produce, res["ressource_id"])
    for produce in res["needed_resources"]:
        G.add_edge(res["ressource_id"], produce)

pos = nx.spring_layout(G, k=0.5, iterations=50)
nx.draw(G, pos, with_labels=True, node_color='lightblue', edge_color='gray', node_size=1500, font_size=16,
        font_color='darkgreen')

for node in G.nodes:
    if not nx.has_path(G, node, "manufacturable"):
        print(f"can't build {node}")
        sys.exit(-1)
print("all resources are manufacturable")

try:
    cycle=nx.find_cycle(G, orientation='original')
    print(f"loop detected! {cycle}")
    sys.exit(-1)
except nx.NetworkXNoCycle as e:
    print("no loop detected")
# Display the graph

# Use Graphviz layout
plt.clf()
pos = graphviz_layout(G, prog="fdp")  # You can also try 'neato', 'fdp', 'sfdp', 'twopi'

# Draw the graph
nx.draw(G, pos, with_labels=True, node_color='skyblue', edge_color='black', node_size=2000, font_size=15)

# Display the graph

plt.show()

sys.exit(0)
