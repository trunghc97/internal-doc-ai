package com.docai.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "documents_share")
public class DocumentShare {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "users_id", nullable = false)
    private Long userId;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "users_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Document document;
}
