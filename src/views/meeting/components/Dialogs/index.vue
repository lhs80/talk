<template>
  <chat-dialog :show="props.menuName === 'chat'" @close="closeDialog"></chat-dialog>
  <invite-dialog :show="props.menuName === 'invite'" @close="closeDialog"></invite-dialog>
  <members-dialog :show="props.menuName === 'members'" @close="closeDialog"></members-dialog>
</template>

<script setup lang="ts">
  import ChatDialog from "../Dialogs/ChatDialog.vue";
  import InviteDialog from "../Dialogs/InviteDialog.vue";
  import MembersDialog from "../Dialogs/MembersDialog.vue";

  const props = defineProps(["menuName"]);
  const emit = defineEmits(["close"]);
  const closeDialog = () => {
    emit("close");
  };
</script>
