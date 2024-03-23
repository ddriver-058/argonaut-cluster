// TODO: Ensure vertical center of text = vertical center of node
<template>
  <v-network-graph
    class='graph'
    v-model:layouts='layouts'
    :eventHandlers='eventHandlers'
    :nodes='nodes'
    :edges='edges'
    :configs='configs'
    v-model:selected-nodes='selectedNodes'
  >
    <template
      #override-node-label='{
        nodeId, scale
      }'
    >
      <text
        x='0'
        :y='nodeTextInitY - nodeTextYOffset'
        :font-size='nodeTextFontSize * scale'
        text-anchor='middle'
        dominant-baseline='central'
        fill='#004080'
      >
        {{ nodeId }}
      </text>
      <text
        v-for='(value, key, index) in nodesMetadataComputed[nodeId]'
        :key='key'
        x='0'
        :y='nodeTextInitY + index * nodeTextYOffset' 
        :font-size='nodeTextFontSize * scale'
        text-anchor='middle'
        dominant-baseline='central'
        fill='#004080'
      >{{ `[${key}: ${value}]` }}</text>
    </template>
  </v-network-graph>
</template>

<script>
import * as vNG from 'v-network-graph'
import axios from 'axios';
import { ref, computed } from "vue";
import { storeToRefs } from 'pinia';
import { isEqual, every, flatten } from 'lodash';

import { useArgonautClusterStore } from 'stores/argonaut-cluster';
import { useNodeStore } from 'src/stores/node-state';
import { useVmStore } from 'stores/vm-state';

import { objMap, selectKeys } from '../services/utilities';

export default {
  name: 'ArgonautClusterGraph',
  // component options
  data() {

    const acStore = useArgonautClusterStore();

    return {
      nodesMetadata: {

      },
      nodeTextFontSize: 10,
      nodeTextInitY: -8,
      nodeTextYOffset: 12,
      configs: vNG.defineConfigs({
        view: {
          panEnabled: true,
          zoomEnabled: true,
          scalingObjects: true
        },
        node: {
          draggable: false,
          selectable: true,
          normal: {
            type: 'square',
            width: 128,
            height: 64,
            borderRadius: 4,
            strokeWidth: 1,
            color: '#e6f2ff' // Set to `node => node.color` to be able to set 'color' key in node data.
          },
          hover: {
            color: '#b3d9ff'
          },
          label: {
            visible: true,
            margin: 0
          }
        }
      })
    }
  },
  computed: {
    nodesMetadataComputed() {

      const acStore = useArgonautClusterStore();
      const nodeStore = useNodeStore();
      const vmStore = useVmStore();

      return objMap({
        cluster: acStore.$state.clusterState,
        ...nodeStore.$state,
        ...vmStore.$state
      }, selectKeys, ['healthStatus', 'vmState'])
      
    },
    selectedNodes: {
      get() {
        const acStore = useArgonautClusterStore();

        return acStore.$state.selectedNodes;
      },
      set(newVal) {
        const acStore = useArgonautClusterStore();

        if(newVal.length == 1) {
          // Single selection (no shift)
          acStore.$state.selectedNodes = this.getCascadingSelection(newVal[0]); // return cascaded
        } else {
          // Multi selection (shift held)
          const newlySelected = this.getNewlySelected(newVal);
          const newlyRemoved = this.getNewlyRemoved(newVal);

          if(newlySelected.length > 0) {
            // shift+click additional
            const addedCascadingSelection = this.getCascadingSelection(newlySelected[0]);
            acStore.$state.selectedNodes = flatten([...addedCascadingSelection, ...acStore.$state.selectedNodes]);
          } else if(newlyRemoved.length > 0) {
            // shift+click remove
            const removedCascadingSelection = this.getCascadingSelection(newlyRemoved[0]);
            acStore.$state.selectedNodes = acStore.$state.selectedNodes.filter((x) => !removedCascadingSelection.includes(x));
          }
        }
      }
    },
    nodes() {
      const acStore = useArgonautClusterStore();
      return acStore.$state.graphNodeConfiguration.nodes;
    },
    edges() {
      const acStore = useArgonautClusterStore();
      return acStore.$state.graphNodeConfiguration.edges;
    },
    layouts: {
      get() {
        const acStore = useArgonautClusterStore();
        return acStore.$state.graphNodeConfiguration.layouts;
      },
      set(newVal) {
        const acStore = useArgonautClusterStore();
        acStore.$state.graphNodeConfiguration.layouts = newVal;
      }
    }
  },
  // async created() {

  // },
  methods: {
    getNewlySelected(selectedNodes) {
      const acStore = useArgonautClusterStore();
      const newlySelected = selectedNodes.filter((x) => !acStore.$state.selectedNodes.includes(x));
      return newlySelected;
    },
    getNewlyRemoved(selectedNodes) {
      const acStore = useArgonautClusterStore();
      const newlyRemoved = acStore.$state.selectedNodes.filter((x) => !selectedNodes.includes(x));
      return newlyRemoved;
    },
    getCascadingSelection(nodeName) {
      // in case they click no nodes
      if(nodeName === undefined) {
        return [];
      }

      function filterEdges(edges, sourceNodes) {
        const out = {};
        for(const edgeId in edges) {
          if(sourceNodes.includes(edges[edgeId].source)) {
            out[edgeId] = edges[edgeId];
          }
        }
        return out;
      };

      function getTargets(edges) {
        const out = [];
        for(const edgeId in edges) {
          out.push(edges[edgeId].target);
        }
        return out;
      };

      const acStore = useArgonautClusterStore();

      const edges = acStore.$state.graphNodeConfiguration.edges;
      const allTargets = [];
      let targets = getTargets(
        filterEdges(
          edges, nodeName
        )
      );
      while(targets.length !== 0) {
        allTargets.push(...targets);
        let newSourceNodes = targets;
        targets = getTargets(
          filterEdges(
            edges, newSourceNodes
          )
        );
      };

      // Now, post all targets to acStore
      const newSelected = [nodeName, ...allTargets];

      return newSelected;
      
    }
  }
}

</script>
<!-- Add 'scoped' attribute to limit CSS to this component only -->
<style scoped>
.graph {
  width: 700px;
  height: 525px;
  border: 1px solid #000;
  background: #fff9e6;
}
</style>
