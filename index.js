// A graph data structure with depth-first search and topological sort.
module.exports = function Graph(serialized){

  // The returned graph instance.
  var graph = {
    addNode: addNode,
    removeNode: removeNode,
    nodes: nodes,
    adjacent: adjacent,
    addEdge: addEdge,
    removeEdge: removeEdge,
    setEdgeWeight: setEdgeWeight,
    getEdgeWeight: getEdgeWeight,
    setEdgeData: setEdgeData,
    getEdgeData: getEdgeData,
    indegree: indegree,
    outdegree: outdegree,
    depthFirstSearch: depthFirstSearch,
    topologicalSort: topologicalSort,
    shortestPath: shortestPath,
    serialize: serialize,
    deserialize: deserialize
  };

  // The adjacency list of the graph.
  // Keys are node ids.
  // Values are adjacent node id arrays.
  var edges = {};

  // The weights of edges.
  // Keys are string encodings of edges.
  // Values are weights (numbers).
  var edgeWeights = {};

  var edgeData = {};

  // If a serialized graph was passed into the constructor, deserialize it.
  if(serialized){
    deserialize(serialized);
  }

  // Adds a node to the graph.
  // If node was already added, this function does nothing.
  // If node was not already added, this function sets up an empty adjacency list.
  function addNode(node){
    edges[node] = adjacent(node);
    return graph;
  }

  // Removes a node from the graph.
  // Also removes incoming and outgoing edges.
  function removeNode(node){
    
    // Remove incoming edges.
    Object.keys(edges).forEach(function (u){
      edges[u].forEach(function (v){
        if(v === node){
          removeEdge(u, v);
        }
      });
    });

    // Remove outgoing edges (and signal that the node no longer exists).
    delete edges[node];

    return graph;
  }

  // Gets the list of nodes that have been added to the graph.
  function nodes(){
    var nodeSet = {};
    Object.keys(edges).forEach(function (u){
      nodeSet[u] = true;
      edges[u].forEach(function (v){
        nodeSet[v] = true;
      });
    });
    return Object.keys(nodeSet);
  }

  // Gets the adjacent node list for the given node.
  // Returns an empty array for unknown nodes.
  function adjacent(node){
    return edges[node] || [];
  }

  // Computes a string encoding of an edge,
  // for use as a key in an object.
  function encodeEdge(u, v){
    return u + "|" + v;
  }

  // Computes a string encoding of an edge,
  // for use as a key in an object.
  function encodeDataEdge (u, v) {
    return u + "||" + v;
  }

  // Sets the weight of the given edge.
  function setEdgeWeight(u, v, weight){
    edgeWeights[encodeEdge(u, v)] = weight;
    return graph;
  }

  // Sets the data of the given edge.
  function setEdgeData(u, v, data){
    edgeData[encodeDataEdge(u, v)] = data;
    return graph;
  }

  // Gets the weight of the given edge.
  // Returns 1 if no weight was previously set.
  function getEdgeWeight(u, v){
    var weight = edgeWeights[encodeEdge(u, v)];
    return weight === undefined ? 1 : weight;
  }

  // Gets the data of the given edge.
  // Returns {} if no weight was previously set.
  function getEdgeData(u, v){
    var data = edgeData[encodeDataEdge(u, v)];
    return data === undefined ? {} : data;
  }

  // Adds an edge from node u to node v.
  // Implicitly adds the nodes if they were not already added.
  function addEdge(u, v, weight, data){
    addNode(u);
    addNode(v);
    adjacent(u).push(v);

    if (weight !== undefined) {
      setEdgeWeight(u, v, weight);
    }

    if (data !== undefined) {
      setEdgeData(u, v, data);
    }

    return graph;
  }

  // Removes the edge from node u to node v.
  // Does not remove the nodes.
  // Does nothing if the edge does not exist.
  function removeEdge(u, v){
    if(edges[u]){
      edges[u] = adjacent(u).filter(function (_v){
        return _v !== v;
      });
    }
    return graph;
  }

  // Computes the indegree for the given node.
  // Not very efficient, costs O(E) where E = number of edges.
  function indegree(node){
    var degree = 0;
    function check(v){
      if(v === node){
        degree++;
      }
    }
    Object.keys(edges).forEach(function (u){
      edges[u].forEach(check);
    });
    return degree;
  }

  // Computes the outdegree for the given node.
  function outdegree(node){
    return node in edges ? edges[node].length : 0;
  }

  // Depth First Search algorithm, inspired by
  // Cormen et al. "Introduction to Algorithms" 3rd Ed. p. 604
  // This variant includes an additional option 
  // `includeSourceNodes` to specify whether to include or
  // exclude the source nodes from the result (true by default).
  // If `sourceNodes` is not specified, all nodes in the graph
  // are used as source nodes.
  function depthFirstSearch(sourceNodes, includeSourceNodes){

    if(!sourceNodes){
      sourceNodes = nodes();
    }

    if(typeof includeSourceNodes !== "boolean"){
      includeSourceNodes = true;
    }

    var visited = {};
    var nodeList = [];

    function DFSVisit(node){
      if(!visited[node]){
        visited[node] = true;
        adjacent(node).forEach(DFSVisit);
        nodeList.push(node);
      }
    }

    if(includeSourceNodes){
      sourceNodes.forEach(DFSVisit);
    } else {
      sourceNodes.forEach(function (node){
        visited[node] = true;
      });
      sourceNodes.forEach(function (node){
        adjacent(node).forEach(DFSVisit);
      });
    }

    return nodeList;
  }

  // The topological sort algorithm yields a list of visited nodes
  // such that for each visited edge (u, v), u comes before v in the list.
  // Amazingly, this comes from just reversing the result from depth first search.
  // Cormen et al. "Introduction to Algorithms" 3rd Ed. p. 613
  function topologicalSort(sourceNodes, includeSourceNodes){
    return depthFirstSearch(sourceNodes, includeSourceNodes).reverse();
  }

  // Dijkstra's Shortest Path Algorithm.
  // Cormen et al. "Introduction to Algorithms" 3rd Ed. p. 658
  // Variable and function names correspond to names in the book.
  function shortestPath(source, destination){

    // Upper bounds for shortest path weights from source.
    var d = {};

    // Predecessors.
    var p = {};

    // Poor man's priority queue, keyed on d.
    var q = {};

    function initializeSingleSource(){
      nodes().forEach(function (node){
        d[node] = Infinity;
      });
      if (d[source] !== Infinity) {
        throw new Error("Source node is not in the graph");
      }
      if (d[destination] !== Infinity) {
        throw new Error("Destination node is not in the graph");
      }
      d[source] = 0;
    }

    // Adds entries in q for all nodes.
    function initializePriorityQueue(){
      nodes().forEach(function (node){
        q[node] = true;
      });
    }

    // Returns true if q is empty.
    function priorityQueueEmpty(){
      return Object.keys(q).length === 0;
    }

    // Linear search to extract (find and remove) min from q.
    function extractMin(){
      var min = Infinity;
      var minNode;
      Object.keys(q).forEach(function(node){
        if (d[node] < min) {
          min = d[node];
          minNode = node;
        }
      });
      if (minNode === undefined) {
        // If we reach here, there's a disconnected subgraph, and we're done.
        q = {};
        return null;
      }
      delete q[minNode];
      return minNode;
    }

    function relax(u, v){
      var w = getEdgeWeight(u, v);
      if (d[v] > d[u] + w) {
        d[v] = d[u] + w;
        p[v] = u;
      }
    }

    function dijkstra(){
      initializeSingleSource();
      initializePriorityQueue();
      while(!priorityQueueEmpty()){
        var u = extractMin();
        adjacent(u).forEach(function (v){
          relax(u, v);
        });
      }
    }

    // Assembles the shortest path by traversing the
    // predecessor subgraph from destination to source.
    function path(){
      var nodeList = [];
      var weight = 0;
      var node = destination;
      while(p[node]){
        nodeList.push(node);
        weight += getEdgeWeight(p[node], node);
        node = p[node];
      }
      if (node !== source) {
        throw new Error("No path found");
      }
      nodeList.push(node);
      nodeList.reverse();
      nodeList.weight = weight;
      return nodeList;
    }

    dijkstra();

    return path();
  }

  // Serializes the graph.
  function serialize(){
    var serialized = {
      nodes: nodes().map(function (id){
        return { id: id };
      }),
      links: []
    };

    serialized.nodes.forEach(function (node){
      var source = node.id;
      adjacent(source).forEach(function (target){
        serialized.links.push({
          source: source,
          target: target,
          weight: getEdgeWeight(source, target),
          data: getEdgeData(source, target)
        });
      });
    });

    return serialized;
  }

  // Deserializes the given serialized graph.
  function deserialize(serialized){
    serialized.nodes.forEach(function (node){ addNode(node.id); });
    serialized.links.forEach(function (link){ addEdge(link.source, link.target, link.weight, link.data); });
    return graph;
  }
  
  return graph;
}
