import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Verify admin from Authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'No auth' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (!roleData) {
    return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { action } = await req.json();

  if (action === 'delete_broken') {
    const { data: broken } = await supabase
      .from('documents')
      .select('id')
      .or('content_text.is.null,content_text.lt.500');

    // Filter by actual length since .lt doesn't work on text length
    // Use raw approach: delete where content is null or very short
    const { error, count } = await supabase
      .from('documents')
      .delete({ count: 'exact' })
      .is('content_text', null);

    // Also delete short content docs
    const { data: allDocs } = await supabase
      .from('documents')
      .select('id, content_text');

    let deletedShort = 0;
    if (allDocs) {
      const shortIds = allDocs
        .filter(d => d.content_text && d.content_text.length < 500)
        .map(d => d.id);
      if (shortIds.length > 0) {
        const { count: c } = await supabase
          .from('documents')
          .delete({ count: 'exact' })
          .in('id', shortIds);
        deletedShort = c || 0;
      }
    }

    return new Response(JSON.stringify({ success: true, deleted: (count || 0) + deletedShort }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (action === 'delete_duplicates') {
    const { data: allDocs } = await supabase
      .from('documents')
      .select('id, title, document_type_id, content_text');

    if (!allDocs) {
      return new Response(JSON.stringify({ success: true, deleted: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const groups = new Map<string, typeof allDocs>();
    for (const doc of allDocs) {
      const key = `${doc.title}::${doc.document_type_id}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(doc);
    }

    const toDelete: string[] = [];
    for (const [, docs] of groups) {
      if (docs.length <= 1) continue;
      docs.sort((a, b) => (b.content_text?.length || 0) - (a.content_text?.length || 0));
      for (let i = 1; i < docs.length; i++) {
        toDelete.push(docs[i].id);
      }
    }

    let deleted = 0;
    if (toDelete.length > 0) {
      const { count } = await supabase.from('documents').delete({ count: 'exact' }).in('id', toDelete);
      deleted = count || 0;
    }

    return new Response(JSON.stringify({ success: true, deleted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (action === 'count_broken') {
    const { data: allDocs } = await supabase
      .from('documents')
      .select('id, content_text');

    const count = allDocs?.filter(d => !d.content_text || d.content_text.length < 500).length || 0;
    return new Response(JSON.stringify({ count }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (action === 'count_duplicates') {
    const { data: allDocs } = await supabase
      .from('documents')
      .select('id, title, document_type_id, content_text');

    if (!allDocs) {
      return new Response(JSON.stringify({ count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const groups = new Map<string, number>();
    for (const doc of allDocs) {
      const key = `${doc.title}::${doc.document_type_id}`;
      groups.set(key, (groups.get(key) || 0) + 1);
    }

    let count = 0;
    for (const [, c] of groups) {
      if (c > 1) count += c - 1;
    }

    return new Response(JSON.stringify({ count }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), {
    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
